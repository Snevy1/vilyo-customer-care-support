import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { organizations, user } from "@/db/schema";
import { SQL, and, eq, or, sql, desc, asc } from "drizzle-orm";

// Safe column map — only expose sortable columns
const SORTABLE_COLUMNS = {
  created_at: organizations.created_at,
  name: organizations.name,
  email: organizations.email,
  web_chat_plan: organizations.web_chat_plan,
  web_chat_status: organizations.web_chat_status,
} as const;

type SortableColumn = keyof typeof SORTABLE_COLUMNS;

export async function GET(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id, userId, email, role = "SUPER_ADMIN" } = JSON.parse(userSession);

    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- QUERY PARAMS ----------------
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const plan = searchParams.get("plan");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const sortByParam = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Safely resolve sort column, fallback to created_at
    const sortColumn = SORTABLE_COLUMNS[sortByParam as SortableColumn] ?? organizations.created_at;

    // ---------------- BUILD WHERE CLAUSE ----------------
    let whereClause: SQL | undefined = undefined;

    if (role === "TENANT_ADMIN") {
      whereClause = eq(organizations.id, organization_id);
    }

    if (plan) {
      whereClause = whereClause
        ? and(whereClause, eq(organizations.web_chat_plan, plan))
        : eq(organizations.web_chat_plan, plan);
    }

    if (status) {
      whereClause = whereClause
        ? and(whereClause, eq(organizations.web_chat_status, status))
        : eq(organizations.web_chat_status, status);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        sql`${organizations.name} ILIKE ${searchPattern}`,
        sql`${organizations.email} ILIKE ${searchPattern}`,
        sql`${organizations.owner_email} ILIKE ${searchPattern}`
      );
      whereClause = whereClause ? and(whereClause, searchCondition) : searchCondition;
    }

    if (fromDate) {
      const fromDateCondition = sql`${organizations.created_at} >= ${fromDate}::timestamp`;
      whereClause = whereClause ? and(whereClause, fromDateCondition) : fromDateCondition;
    }

    if (toDate) {
      const toDateCondition = sql`${organizations.created_at} <= ${toDate}::timestamp`;
      whereClause = whereClause ? and(whereClause, toDateCondition) : toDateCondition;
    }

    // ---------------- FETCH ----------------
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(organizations);
    const countResult = whereClause ? await countQuery.where(whereClause) : await countQuery;
    const total = Number(countResult[0]?.count || 0);

    const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const baseQuery = db.select().from(organizations);
    const finalQuery = whereClause
      ? baseQuery.where(whereClause).orderBy(orderByClause).limit(limit).offset(offset)
      : baseQuery.orderBy(orderByClause).limit(limit).offset(offset);

    const orgs = await finalQuery;

    // ---------------- USER COUNTS ----------------
    const orgsWithUserCounts = await Promise.all(
      orgs.map(async (org) => {
        const userCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(user)
          .where(eq(user.organization_id, org.id));

        return {
          ...org,
          user_count: Number(userCount[0]?.count || 0),
        };
      })
    );

    // ---------------- STATS ----------------
    const statsQuery = db.select({
      total_organizations: sql<number>`count(*)`,
      active_subscriptions: sql<number>`count(case when ${organizations.web_chat_status} = 'active' then 1 end)`,
      free_plan: sql<number>`count(case when ${organizations.web_chat_plan} = 'free' then 1 end)`,
      pro_plan: sql<number>`count(case when ${organizations.web_chat_plan} = 'pro' then 1 end)`,
      total_users: sql<number>`(select count(*) from ${user})`,
      recent_signups: sql<number>`count(case when ${organizations.created_at} > now() - interval '30 days' then 1 end)`,
    }).from(organizations);

    const statsResult = whereClause ? await statsQuery.where(whereClause) : await statsQuery;

    const stats = statsResult[0] || {
      total_organizations: 0,
      active_subscriptions: 0,
      free_plan: 0,
      pro_plan: 0,
      total_users: 0,
      recent_signups: 0,
    };

    return NextResponse.json({
      organizations: orgsWithUserCounts,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      stats,
    });

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}