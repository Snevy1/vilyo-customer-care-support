"use client"

import React, { useState } from "react";
import { PoundSterling } from "lucide-react";
import EditDuration from "./EditDuration";
import AddDuration from "./AddDuration";
import DeleteDuration from "./DeleteDuration";
import { convertHoursToString } from "./convertHours";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: Uncomment when API is ready
// import { useGetAllDurationsQuery } from "@/store/duration/durations-api";

type DurationType = {
  _id: string;
  name: number;
  price: number;
  visibility: boolean;
};

// Static data for durations
const staticDurations: DurationType[] = [
  { _id: "1", name: 24, price: 50, visibility: true },
  { _id: "2", name: 48, price: 90, visibility: true },
  { _id: "3", name: 168, price: 300, visibility: true }, // 1 week
  { _id: "4", name: 720, price: 1200, visibility: false }, // 1 month
];

const Page = () => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedDurationId, setSelectedDurationId] = useState<string | null>(null);
  const [selectedDurationData, setSelectedDurationData] = useState<DurationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Uncomment when API is ready
  // const { data: durations, isLoading, isError } = useGetAllDurationsQuery();

  // Static implementation
  const durations = staticDurations;
  const isError = false;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Error fetching durations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-lg mt-5">
      <div className="w-full flex items-center p-5">
        <p className="text-xl text-medium text-black">
          {durations?.length || 0} Items
        </p>
        <div className="flex ml-auto">
          <Button
            onClick={() => setIsAddModalVisible(true)}
            className="bg-blue-400 hover:bg-blue-400"
          >
            Add Duration
          </Button>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-lg border border-gray-200 mb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Duration Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!durations || durations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No durations found
                  </TableCell>
                </TableRow>
              ) : (
                durations.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{convertHoursToString(record.name)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PoundSterling className="w-4 h-4 mr-2" />
                        {record.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setSelectedDurationData(record);
                        }}
                        className="bg-blue-500 hover:bg-blue-400"
                      >
                        Edit
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedDurationId(record._id);
                          setIsDeleteModalVisible(true);
                        }}
                        className="bg-red-500 hover:bg-red-400"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddDuration
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
      />

      {selectedDurationData && (
        <EditDuration
          data={selectedDurationData}
          onClose={() => setSelectedDurationData(null)}
        />
      )}

      {selectedDurationId && (
        <DeleteDuration
          visible={isDeleteModalVisible}
          onClose={() => setIsDeleteModalVisible(false)}
          durationId={selectedDurationId}
        />
      )}
    </div>
  );
};

export default Page;