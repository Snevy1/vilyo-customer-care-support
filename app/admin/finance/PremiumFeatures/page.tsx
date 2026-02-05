import { PoundSterling } from "lucide-react";
import AddFeature from "./AddFeature";
import { useState, useEffect } from "react";

// shadcn/ui imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {toast} from "sonner"

// TODO: Uncomment when API is ready
// import { useGetAllFeaturesQuery, useUpdateFeatureMutation } from "@/store/subscriptions/subscriptions-api";

type FeaturesType = {
  _id: string;
  name: string;
  price: number;
  visibility: boolean;
  description?: string;
};

// Static data for features
const staticFeatures: FeaturesType[] = [
  {
    _id: "1",
    name: "Feature A",
    price: 10,
    visibility: true,
    description: "Description for Feature A",
  },
  {
    _id: "2",
    name: "Feature B",
    price: 20,
    visibility: false,
    description: "Description for Feature B",
  },
  {
    _id: "3",
    name: "Feature C",
    price: 15,
    visibility: true,
    description: "Description for Feature C",
  },
];

const PremiumFeatures = () => {
  const [features, setFeatures] = useState<FeaturesType[]>(staticFeatures);
  const [isLoading, setIsLoading] = useState(false);
  

  // TODO: Uncomment when API is ready
  // const { data: features, isLoading, isError, refetch } = useGetAllFeaturesQuery();
  // const [updateFeature] = useUpdateFeatureMutation();

  const refetch = () => {
    // Static implementation - would normally refetch from API
    console.log("Refetching features...");
  };

  const handleVisibilityChange = async (record: FeaturesType, checked: boolean) => {
    try {
      // TODO: Uncomment when API is ready
      // await updateFeature({ id: record._id, updates: { visibility: checked } }).unwrap();
      /* toast.success("Success", {
               description: `Visibility ${checked ? "enabled" : "disabled"} successfully.`,
              }); */
     
      // refetch();

      // Static implementation
      setFeatures((prev) =>
        prev.map((feature) =>
          feature._id === record._id ? { ...feature, visibility: checked } : feature
        )
      );

      toast.success("Success", {
               description: `Visibility ${checked ? "enabled" : "disabled"} successfully. (static mode)`,
              });

      
    } catch (error) {
        toast.error("Error", {
               description: "Failed to update visibility.",
              });

      
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // TODO: Uncomment when API is ready
  // if (isError) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <p className="text-red-500">Error loading features.</p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col bg-white rounded-lg mt-5">
      <div className="w-full flex items-center p-5">
        <p className="text-xl text-medium text-black">{features?.length || 0} Items</p>
        <div className="flex ml-auto">
          <AddFeature data={null} refetch={refetch} />
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-lg border border-gray-200 mb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!features || features.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No features found
                  </TableCell>
                </TableRow>
              ) : (
                features.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PoundSterling className="w-4 h-4 mr-2" />
                        {record.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={record.visibility}
                        onCheckedChange={(checked) =>
                          handleVisibilityChange(record, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <AddFeature data={record} refetch={refetch} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatures;