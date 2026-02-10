import { X, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import "../../globals.css"

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// TODO: Uncomment when API is ready
// import {
//   useCreateSubscriptionPackageMutation,
//   useGetAllFeaturesQuery,
// } from "@/store/subscriptions/subscriptions-api";
// import { useAddAdminNotificationMutation } from "@/store/dashboard/admin-notification-api";

interface FakeDataItem {
  type: "item" | "benefit" | "extra";
  _id?: string;
  name?: string;
  minQty?: number;
  maxQty?: number;
  price?: number;
  description?: string;
}

// Static data for premium features
const staticPremiumFeatures = [
  { _id: "1", name: "Feature A", price: 10 },
  { _id: "2", name: "Feature B", price: 20 },
  { _id: "3", name: "Feature C", price: 15 },
  { _id: "4", name: "Feature D", price: 25 },
  { _id: "5", name: "Feature E", price: 30 },
];

export default function AddNew() {
  const [open, setOpen] = useState(false);
  const [packageTitle, setPackageTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [basePriceMin, setBasePriceMin] = useState<number | undefined>(0);
  const [basePriceMax, setBasePriceMax] = useState<number | undefined>(0);
  const [minItems, setMinItems] = useState(1);
  const [items, setItems] = useState<FakeDataItem[]>([]);
  const [extras, setExtras] = useState<FakeDataItem[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>("usd");
  const [interval, setInterval] = useState<string>("monthly");
  const [trialPeriodDays, setTrialPeriodDays] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBenefitsVisible, setIsBenefitsVisible] = useState(true);

  

  // TODO: Uncomment when API is ready
  // const [createSubscriptionPackage, { isLoading }] =
  //   useCreateSubscriptionPackageMutation();
  // const { data: premiumFeatures, isError, refetch } = useGetAllFeaturesQuery();
  // const [addNotification] = useAddAdminNotificationMutation();

  // Static implementation
  const premiumFeatures = staticPremiumFeatures;

  const [pfstate, setPfstate] = useState(premiumFeatures);

  useEffect(() => {
    if (premiumFeatures) {
      setPfstate(premiumFeatures);
    }
  }, [premiumFeatures]);

  const handleAddItem = (type: "item" | "extra") => {
    const newItem: FakeDataItem = {
      type,
      name: "",
      minQty: 1,
      maxQty: 10,
      price: 0,
    };
    if (type === "item") setItems([...items, newItem]);
    else setExtras([...extras, newItem]);
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, ""]);
  };

  const getAuthState = (): any | null => {
    const authStateString = localStorage.getItem("authState");
    return authStateString ? JSON.parse(authStateString) : null;
  };

  const authState = getAuthState();
  const user = authState?.user;

  const handleCreatePackage = async () => {
    try {
      if (!packageTitle || !items.length) {
        toast.error("Error", {
           description: "Please add the title and at least 1 item.",
          });
        
        return;
      }

      setIsLoading(true);

      const payload = {
        name: packageTitle,
        subtitle: subtitle || undefined,
        benefits: benefits.filter((b) => b.trim() !== ""),
        basePriceMin,
        basePriceMax,
        minItems,
        currency,
        interval,
        trial_period_days: trialPeriodDays,
        features: [
          ...items.map((item) => ({
            _id: item._id,
            minQty: item.minQty,
            maxQty: item.maxQty,
            customPrice: item.price,
            type: "item",
          })),
          ...extras.map((extra) => ({
            _id: extra._id,
            minQty: extra.minQty,
            maxQty: extra.maxQty,
            customPrice: extra.price,
            type: "extra",
          })),
        ],
      };

      // TODO: Uncomment when API is ready
      // await createSubscriptionPackage(payload).unwrap();
      //
      // await addNotification({
      //   title: "Created subscription package",
      //   description: "Created subscription package",
      //   status: "unread",
      //   userId: user?._id,
      // }).unwrap();

      // Static implementation - simulate API call
      console.log("Package payload:", payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Success", {
           description: "Package created successfully! (static mode)",
          });

      // Reset form
      setPackageTitle("");
      setSubtitle("");
      setBasePriceMin(0);
      setBasePriceMax(0);
      setMinItems(1);
      setItems([]);
      setExtras([]);
      setBenefits([]);
      setCurrency("usd");
      setInterval("monthly");
      setTrialPeriodDays(0);
      setOpen(false);
    } catch (error) {

            toast.error("Error", {
           description: "Failed to create subscription package.",
          });

      
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrease = (index: number, field: "minQty" | "maxQty") => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]:
                field === "minQty"
                  ? Math.min(item.maxQty!, item[field]! + 1)
                  : item[field]! + 1,
            }
          : item
      )
    );
  };

  const handleDecrease = (index: number, field: "minQty" | "maxQty") => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index && item[field]! > 1
          ? {
              ...item,
              [field]:
                field === "maxQty"
                  ? Math.max(item.minQty!, item[field]! - 1)
                  : Math.max(1, item[field]! - 1),
            }
          : item
      )
    );
  };

  const handleIncrease2 = (index: number, field: "minQty" | "maxQty") => {
    setExtras((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]:
                field === "minQty"
                  ? Math.min(item.maxQty!, item[field]! + 1)
                  : item[field]! + 1,
            }
          : item
      )
    );
  };

  const handleDecrease2 = (index: number, field: "minQty" | "maxQty") => {
    setExtras((prev) =>
      prev.map((item, idx) =>
        idx === index && item[field]! > 1
          ? {
              ...item,
              [field]:
                field === "maxQty"
                  ? Math.max(item.minQty!, item[field]! - 1)
                  : Math.max(1, item[field]! - 1),
            }
          : item
      )
    );
  };

  const runPrice = () => {
    let sumMin = 0;
    let sumMax = 0;
    let i = 0;
    for (i; i < items.length; i++) {
      if (items[i]?.type === "item") {
        sumMin += (items[i].minQty || 0) * (items[i].price || 0);
        sumMax += (items[i].maxQty || 0) * (items[i].price || 0);
      }
    }
    setBasePriceMin(sumMin);
    setBasePriceMax(sumMax);
    return [sumMin, sumMax];
  };

  useEffect(() => {
    runPrice();
  }, [items, extras]);

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="rounded-md px-6 py-2 text-white bg-blue-400 flex items-center hover:bg-blue-200 transition-colors">
            Create New Package
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Package</DialogTitle>
          </DialogHeader>

          <div className="bg-white w-full pb-5">
            {/* Header Section with Blue Background */}
            <div className="w-full bg-blue-400 text-white rounded-lg p-4 mb-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageTitle" className="text-white">
                    Package Title
                  </Label>
                  <Input
                    id="packageTitle"
                    value={packageTitle}
                    onChange={(e:any) => setPackageTitle(e.target.value)}
                    placeholder="Enter package title"
                    className="bg-[#EEF5F9] text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-white">
                    Subtitle
                  </Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e:any) => setSubtitle(e.target.value)}
                    placeholder="Enter subtitle"
                    className="bg-[#EEF5F9] text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-white">
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-[#EEF5F9] text-black">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval" className="text-white">
                    Interval
                  </Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger className="bg-[#EEF5F9] text-black">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trialPeriod" className="text-white">
                    Trial Period (Days)
                  </Label>
                  <Input
                    id="trialPeriod"
                    type="number"
                    value={trialPeriodDays}
                    onChange={(e:any) => setTrialPeriodDays(Number(e.target.value))}
                    placeholder="Trial period days"
                    className="bg-[#EEF5F9] text-black"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="px-3">
              <div className="flex justify-between gap-4 text-[18px] font-semibold text-[rgba(0,0,0,0.7)] mb-2 text-center">
                <h4 className="w-[50%]">Item</h4>
                <h4 className="w-[25%]">Min Qty</h4>
                <h4 className="w-[25%]">Max Qty</h4>
                <h4 className="w-[12%]">£</h4>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="text-white text-sm flex justify-between gap-4"
                  >
                    <X
                      className="text-[#FF0000] my-auto text-[26px] cursor-pointer"
                      onClick={() => {
                        setItems((prev) => {
                          const removedItem = prev[index];
                          const updatedItems = prev.filter((_, idx) => idx !== index);
                          setPfstate((prevPfstate) => {
  if (
    removedItem?._id && // ensure _id exists
    !prevPfstate.some((feature) => feature._id === removedItem._id)
  ) {
    return [...prevPfstate, {
      _id: removedItem._id,
      name: removedItem.name ?? "",
      price: removedItem.price ?? 0,
    }];
  }
  return prevPfstate;
});
                          return updatedItems;
                        });
                      }}
                    />

                    <div className="w-[52%] flex gap-1 items-center justify-between">
                      <div className="w-full rounded-lg bg-blue-400">
                        <Select
                          value={item._id}
                          onValueChange={(selectedId:any) => {
                            const selectedFeature = premiumFeatures.find(
                              (f) => f._id === selectedId
                            );

                            setItems((prev) =>
                              prev.map((d, idx) =>
                                idx === index
                                  ? {
                                      ...d,
                                      _id: selectedId,
                                      name: selectedFeature?.name,
                                      price: selectedFeature?.price || 0,
                                    }
                                  : d
                              )
                            );

                            setPfstate((prev) => {
                              const previouslySelectedItem = item._id;
                              const updatedPfstate = prev.filter(
                                (r) => r._id !== selectedId
                              );

                              if (previouslySelectedItem) {
                                const previouslySelectedFeature =
                                  premiumFeatures.find(
                                    (f) => f._id === previouslySelectedItem
                                  );
                                if (previouslySelectedFeature) {
                                  updatedPfstate.push(previouslySelectedFeature);
                                }
                              }

                              return updatedPfstate;
                            });
                          }}
                        >
                          <SelectTrigger className="bg-blue-400 text-white border-none">
                            <SelectValue placeholder="Select premium feature" />
                          </SelectTrigger>
                          <SelectContent>
                            {pfstate?.map((feature) => (
                              <SelectItem key={feature?._id} value={feature?._id}>
                                {feature?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Min Qty */}
                    <div className="border border-blue-400 rounded-lg flex w-[25%]">
                      <input
                        type="number"
                        className="h-full outline-none text-black bg-transparent w-[50%] text-center"
                        value={item.minQty}
                        min={0}
                        max={item.maxQty}
                        onChange={(e) => {
                          const inputValue = Number(e.target.value);
                          const newMinQty = Math.max(
                            0,
                            Math.min(inputValue, item.maxQty!)
                          );

                          setItems((prev) => {
                            const rebuild = [...prev];
                            const newData = rebuild
                              .filter((item) => item?.type === "item")
                              .map((item, i) => {
                                if (index === i)
                                  return {
                                    ...item,
                                    minQty: newMinQty,
                                  };
                                return item;
                              });

                            const unBenifitData = rebuild?.filter(
                              (item) => item?.type !== "item"
                            );
                            return [...newData, ...unBenifitData];
                          });
                        }}
                      />

                      <div className="bg-blue-400 h-full w-[50%] flex flex-col justify-between py-1 gap-3 text-[20px] rounded-r-lg">
                        <button>
                          <Plus
                            className="cursor-pointer text-[#06DC1B]"
                            size={20}
                            onClick={() => handleIncrease(index, "minQty")}
                          />
                        </button>
                        <Minus
                          className="cursor-pointer text-[#FF0000]"
                          size={20}
                          onClick={() => handleDecrease(index, "minQty")}
                        />
                      </div>
                    </div>

                    {/* Max Qty */}
                    <div className="border border-blue-400 rounded-lg flex w-[25%]">
                      <input
                        type="number"
                        className="h-full outline-none text-black bg-transparent w-[50%] text-center"
                        value={item.maxQty}
                        onChange={(e) => {
                          setItems((prev) => {
                            const rebuild = [...prev];
                            const newData = rebuild
                              .filter((item) => item?.type === "item")
                              .map((item, i) => {
                                if (index === i)
                                  return {
                                    ...item,
                                    maxQty: Number(e.target.value),
                                  };
                                return item;
                              });
                            const unBenifitData = rebuild?.filter(
                              (item) => item?.type !== "item"
                            );
                            return [...newData, ...unBenifitData];
                          });
                        }}
                      />
                      <div className="bg-blue-400 h-full w-[50%] flex flex-col justify-between py-1 gap-3 text-[20px] rounded-r-lg">
                        <Plus
                          className="cursor-pointer text-[#06DC1B]"
                          size={20}
                          onClick={() => handleIncrease(index, "maxQty")}
                        />
                        <Minus
                          className="cursor-pointer text-[#FF0000]"
                          size={20}
                          onClick={() => handleDecrease(index, "maxQty")}
                        />
                      </div>
                    </div>

                    {/* Price */}
                    <input
                      value={item?.price}
                      onChange={(e) => {
                        setItems((prev) =>
                          prev.map((i, idx) =>
                            idx === index ? { ...i, price: Number(e.target.value) } : i
                          )
                        );
                      }}
                      type="number"
                      placeholder="Price"
                      className="px-3 text-white bg-blue-400 flex justify-center items-center w-[12%] rounded-lg"
                    />
                  </div>
                ))}

                <button
                  onClick={() => handleAddItem("item")}
                  className="flex items-center text-blue-400 hover:bg-indigo-50 rounded-lg py-2"
                >
                  <Plus className="mr-2" size={20} /> Add Item
                </button>
              </div>
            </div>

            {/* Minimum Items */}
            <div className="ml-2 mt-4">
              <div className="border border-grey bg-blue-400 text-white rounded-md flex items-center py-1 px-5 w-fit">
                <p className="mr-2">Minimum Items</p>
                <Separator orientation="vertical" className="mx-2 bg-white h-6" />
                <select
                  className="bg-inherit focus:ring focus:outline-none"
                  value={minItems}
                  onChange={(e) => setMinItems(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((r) => (
                    <option key={r} value={r} className="text-black">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-5 px-3">
              <div
                className="flex justify-between gap-2 mb-4 cursor-pointer"
                onClick={() => setIsBenefitsVisible(!isBenefitsVisible)}
              >
                <h4 className="font-semibold">Other benefits</h4>
              </div>
              <div className="flex flex-col gap-3">
                {benefits.map((benefit, index) => (
                  <div className="flex flex-row space-x-2" key={index}>
                    <X
                      className="text-[#FF0000] my-auto text-[26px] cursor-pointer"
                      onClick={() => {
                        setBenefits((prev) => prev.filter((_, idx) => idx !== index));
                      }}
                    />
                    <input
                      value={benefit}
                      onChange={(e) => {
                        setBenefits((prev) =>
                          prev.map((b, idx) => (idx === index ? e.target.value : b))
                        );
                      }}
                      placeholder="Write here"
                      className="p-2 w-full bg-blue-400 text-white rounded-md focus:outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={handleAddBenefit}
                  className="flex items-center text-blue-400 hover:bg-indigo-50 rounded-lg py-2"
                >
                  <Plus className="mr-2" size={20} /> Add Benefit
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="my-5 px-3 flex flex-col gap-2">
              <label className="text-lg">Price</label>
              <div className="bg-[#F0F0FF] rounded-lg p-2 h-12 w-full flex items-center justify-center text-center text-2xl focus:outline-none">
                <p className="text-center text-lg font-bold tracking-wide text-blue-400">
                  {basePriceMin} - {basePriceMax}
                </p>
              </div>
            </div>

            {/* Extras Section */}
            <div className="my-5 px-3">
              <div className="flex justify-between items-center bg-[#F0F0FF] p-3 rounded-lg">
                <h3 className="font-normal text-blue-400">Extras</h3>
                {extras.length ? (
                  extras.length
                ) : (
                  <p className="text-[#FD1E20]">No Extra</p>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-4">
                {extras
                  ?.filter((item) => item.type === "extra")
                  .map((item, index) => (
                    <div
                      key={index}
                      className="text-white text-sm flex justify-between gap-4"
                    >
                      <X
                        className="text-[#FF0000] my-auto text-[26px] cursor-pointer"
                        onClick={() => {
                          setExtras((prev) => {
                            const removedItem = prev[index];
                            const updatedItems = prev.filter((_, idx) => idx !== index);
                            setPfstate((prevPfstate) => {
  
  if (
    removedItem?._id &&
    !prevPfstate.some((feature) => feature._id === removedItem._id)
  ) {
    // Normalize to match the state type exactly
    const normalizedItem: { _id: string; name: string; price: number } = {
      _id: removedItem._id,
      name: removedItem.name ?? "",
      price: removedItem.price ?? 0,
    };

    return [...prevPfstate, normalizedItem];
  }

  return prevPfstate;
});

                            return updatedItems;
                          });
                        }}
                      />

                      <div className="w-[52%] flex gap-1 items-center justify-between">
                        <div className="w-full rounded-lg bg-blue-400">
                          <Select
                            value={item._id}
                            onValueChange={(selectedId:any) => {
                              const selectedFeature = premiumFeatures.find(
                                (f) => f._id === selectedId
                              );

                              setExtras((prev) =>
                                prev.map((d, idx) =>
                                  idx === index
                                    ? {
                                        ...d,
                                        _id: selectedId,
                                        name: selectedFeature?.name,
                                        price: selectedFeature?.price || 0,
                                      }
                                    : d
                                )
                              );

                              setPfstate((prev) => {
                                const previouslySelectedItem = item._id;
                                const updatedPfstate = prev.filter(
                                  (r) => r._id !== selectedId
                                );

                                if (previouslySelectedItem) {
                                  const previouslySelectedFeature =
                                    premiumFeatures.find(
                                      (f) => f._id === previouslySelectedItem
                                    );
                                  if (previouslySelectedFeature) {
                                    updatedPfstate.push(previouslySelectedFeature);
                                  }
                                }

                                return updatedPfstate;
                              });
                            }}
                          >
                            <SelectTrigger className="bg-blue-400 text-white border-none">
                              <SelectValue placeholder="Select premium feature" />
                            </SelectTrigger>
                            <SelectContent>
                              {pfstate.map((feature) => (
                                <SelectItem key={feature._id} value={feature._id}>
                                  {feature.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Min Qty for Extras */}
                      <div className="border border-blue-400 rounded-lg flex w-[25%]">
                        <input
                          type="number"
                          className="h-full outline-none text-black bg-transparent w-[50%] text-center"
                          value={item.minQty}
                          onChange={(e) => {
                            setExtras((prev) => {
                              const rebuild = [...prev];
                              const newData = rebuild
                                .filter((item) => item?.type === "extra")
                                .map((item, i) => {
                                  if (index === i)
                                    return {
                                      ...item,
                                      minQty: Number(e.target.value),
                                    };
                                  return item;
                                });
                              const unBenifitData = rebuild?.filter(
                                (item) => item?.type !== "extra"
                              );
                              return [...newData, ...unBenifitData];
                            });
                          }}
                        />
                        <div className="bg-blue-400 h-full w-[50%] flex flex-col justify-between py-1 gap-3 text-[20px] rounded-r-lg">
                          <button>
                            <Plus
                              className="cursor-pointer text-[#06DC1B]"
                              size={20}
                              onClick={() => handleIncrease2(index, "minQty")}
                            />
                          </button>
                          <Minus
                            className="cursor-pointer text-[#FF0000]"
                            size={20}
                            onClick={() => handleDecrease2(index, "minQty")}
                          />
                        </div>
                      </div>

                      {/* Max Qty for Extras */}
                      <div className="border border-blue-400 rounded-lg flex w-[25%]">
                        <input
                          type="number"
                          className="h-full outline-none text-black bg-transparent w-[50%] text-center"
                          value={item.maxQty}
                          onChange={(e) => {
                            setExtras((prev) => {
                              const rebuild = [...prev];
                              const newData = rebuild
                                .filter((item) => item?.type === "extra")
                                .map((item, i) => {
                                  if (index === i)
                                    return {
                                      ...item,
                                      maxQty: Number(e.target.value),
                                    };
                                  return item;
                                });
                              const unBenifitData = rebuild?.filter(
                                (item) => item?.type !== "extra"
                              );
                              return [...newData, ...unBenifitData];
                            });
                          }}
                        />
                        <div className="bg-blue-400 h-full w-[50%] flex flex-col justify-between py-1 gap-3 text-[20px] rounded-r-lg">
                          <Plus
                            className="cursor-pointer text-[#06DC1B]"
                            size={20}
                            onClick={() => handleIncrease2(index, "maxQty")}
                          />
                          <Minus
                            className="cursor-pointer text-[#FF0000]"
                            size={20}
                            onClick={() => handleDecrease2(index, "maxQty")}
                          />
                        </div>
                      </div>

                      {/* Price for Extras */}
                      <input
                        value={item?.price}
                        onChange={(e) => {
                          setExtras((prev) =>
                            prev.map((i, idx) =>
                              idx === index ? { ...i, price: Number(e.target.value) } : i
                            )
                          );
                        }}
                        type="number"
                        className="px-3 text-white bg-blue-400 flex justify-center items-center w-[12%] rounded-lg"
                      />
                    </div>
                  ))}

                <button
                  onClick={() => handleAddItem("extra")}
                  className="flex items-center text-blue-400 hover:bg-indigo-50 rounded-lg py-2"
                >
                  <Plus className="mr-2" size={20} /> Add Extra
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-end w-full gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePackage}
                disabled={isLoading}
                className="bg-blue-400 hover:bg-blue-200 text-white"
              >
                {isLoading ? "Creating..." : "Create Package"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}