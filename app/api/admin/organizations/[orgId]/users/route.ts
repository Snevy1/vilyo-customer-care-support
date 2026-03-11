import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { user, organizations } from "@/db/schema";
import { eq, and, SQL, sql } from "drizzle-orm";



export async function GET(request: NextRequest,  {params}:{ params: Promise<{ orgId: string }>}  ) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id, userId, email, role ="SUPER_ADMIN"} = JSON.parse(userSession);
    const { orgId } =  await params;

    // ---------------- AUTHORIZATION ----------------
    // Check if user has access to this organization
    if (role === "TENANT_ADMIN" && organization_id !== orgId) {
      return NextResponse.json(
        { error: "Forbidden - You can only view users from your own organization" },
        { status: 403 }
      );
    }

    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- VERIFY ORGANIZATION EXISTS ----------------
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // ---------------- QUERY PARAMS ----------------
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    
    // Search
    const search = searchParams.get("search");

    // ---------------- BUILD WHERE CLAUSE ----------------
    let whereClause: SQL | undefined = eq(user.organization_id, orgId);

    // Apply search filter if provided
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause = and(
        whereClause,
        sql`(${user.name} ILIKE ${searchPattern} OR ${user.email} ILIKE ${searchPattern})`
      );
    }

    // ---------------- FETCH USERS ----------------
    
    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);
    
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    // Fetch users with pagination
    const users = await db.select()
      .from(user)
      .where(whereClause)
      .orderBy(user.created_at)
      .limit(limit)
      .offset(offset);

    // ---------------- ENRICH USER DATA ----------------
    const enrichedUsers = users.map(u => ({
      ...u,
      // Add any additional computed fields here
      initials: u.name 
        ? u.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : u.email.substring(0, 2).toUpperCase(),
      created_at_formatted: u.created_at,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        plan: organization.web_chat_plan,
        status: organization.web_chat_status,
      },
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching organization users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}