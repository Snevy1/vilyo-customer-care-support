"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Edit3, LoaderCircle } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import {
  useUser,
  useUpdateUser,
  useUpdateProfilePicture,
  useUpdatePassword,
  useUpdateNotificationInterval,
} from "@/hooks/queries/useUser";
import { toast } from "react-toastify";

const Profile = () => {
  // React Query hooks
  //const { data: user, isLoading, error } = useUser();
  const updateUserMutation = useUpdateUser();
  const updateProfilePictureMutation = useUpdateProfilePicture();
  const updatePasswordMutation = useUpdatePassword();
  const updateNotificationIntervalMutation = useUpdateNotificationInterval();

  // Local UI state
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangeEmailVisible, setIsChangeEmailVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
// Just for testing 

const [isLoading,setIsLoading] = useState(false)
const [error,setIsError] = useState({message: ""}) // These are for testing, will replace with actual api calls
  let user = {
    _id: "001",
    name:"nevily" ,
    email: "simiyunevily@gmail.com",
    messageNotificationInterval: 5,
    profilePicture: {imageUrl: "https://images.unsplash.com/photo-1714079761488-e0c9b9ac4138?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGN1c3RvbWVyJTIwc3VwcG9ydHxlbnwwfHwwfHx8MA%3D%3D"}
  }

  // Initialize form values from user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setSelectedValue(user.messageNotificationInterval?.toString() || "");
    }
  }, [user]);

  // Handle notification interval change
  const handleIntervalChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);

    if (!user?._id) {
      toast.error("User not found");
      return;
    }

    updateNotificationIntervalMutation.mutate(
      {
        userId: user._id,
        interval: Number(newValue),
      },
      {
        onError: () => {
          // Revert to previous value on error
          setSelectedValue(user.messageNotificationInterval?.toString() || "");
        },
      }
    );
  };

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    updateProfilePictureMutation.mutate(
      {
        userId: user._id,
        file,
      },
      {
        onError: () => {
          setImagePreview(null);
        },
      }
    );
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!user?._id) {
      toast.error("User not found");
      return;
    }

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter your new password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    updatePasswordMutation.mutate(
      {
        userId: user._id,
        oldPassword: currentPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          setIsChangePasswordVisible(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        },
      }
    );
  };

  // Handle email update
  const handleUpdateEmail = async () => {
    if (!user?._id) {
      toast.error("User not found");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    updateUserMutation.mutate(
      {
        userId: user._id,
        updates: { email },
      },
      {
        onSuccess: () => {
          setIsChangeEmailVisible(false);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Error state
  /* if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error loading profile: {error.message}</div>
      </div>
    );
  } */

  // No user state
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No user data available</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-md p-4">
        <div className="scale-90">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-1 ml-3">
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="profile preview"
                  className="rounded-full aspect-square object-cover h-10 w-10 md:h-21.25 md:w-21.25"
                />
              ) : user?.profilePicture?.imageUrl ? (
                <img
                  src={user.profilePicture?.imageUrl}
                  alt="profile"
                  className="rounded-full aspect-square object-cover h-10 w-10 md:h-21.25 md:w-21.25"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-blue-400 h-10 w-10 md:h-21.25 md:w-21.25"
                />
              )}

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                disabled={updateProfilePictureMutation.isPending}
              />

              {/* Edit icon overlay */}
              <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full cursor-pointer">
                {updateProfilePictureMutation.isPending ? (
                  <LoaderCircle className="w-5 h-5 text-secondaryBorder animate-spin" />
                ) : (
                  <Edit3
                    onClick={handleIconClick}
                    className=" text-primaryLime hover:text-primaryLime/80 transition-colors"
                    size={30}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Profile Info Sections */}
          <div className="flex flex-col gap-7 m-5">
            {/* Name Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[rgba(0,0,0,0.7)] font-semibold text-[15px]">Name</h3>
              <p className="text-black font-semibold text-[20px]">{user.name}</p>
            </div>

            {/* Email Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[rgba(0,0,0,0.7)] font-semibold text-[15px]">Email</h3>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <input
                  value={email}
                  readOnly={!isChangeEmailVisible}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "text-black font-semibold rounded-md p-2 border border-transparent text-[15px] w-full md:w-auto",
                    isChangeEmailVisible ? "border border-gray-600 bg-gray-50" : "bg-transparent"
                  )}
                />
                <button
                  onClick={() => {
                    if (isChangeEmailVisible) {
                      handleUpdateEmail();
                    } else {
                      setIsChangeEmailVisible(true);
                    }
                  }}
                  disabled={updateUserMutation.isPending}
                  className="p-2 lg:ml-5 bg-[rgba(217,217,217,0.87)] cursor-pointer font-medium text-black hover:bg-gray-300 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? (
                    <LoaderCircle className="w-4 h-4 animate-spin inline mr-2" />
                  ) : null}
                  {isChangeEmailVisible ? "Save Email" : "Change Email"}
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[rgba(0,0,0,0.7)] font-semibold text-[15px]">Password</h3>
              {isChangePasswordVisible ? (
                <div className="flex flex-col gap-3 max-w-md">
                  <input
                    value={currentPassword}
                    type="password"
                    placeholder="Current Password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="text-black font-semibold rounded-md p-2 border border-gray-600 text-[16px]"
                  />
                  <input
                    value={newPassword}
                    type="password"
                    placeholder="New Password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-black font-semibold rounded-md p-2 border border-gray-600 text-[16px]"
                  />
                  <input
                    value={confirmNewPassword}
                    type="password"
                    placeholder="Confirm New Password"
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="text-black font-semibold rounded-md p-2 border border-gray-600 text-[16px]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={updatePasswordMutation.isPending}
                      className="p-2 bg-blue-400 font-medium cursor-pointer text-white hover:bg-blue-200 transition-colors px-4 disabled:opacity-50"
                    >
                      {updatePasswordMutation.isPending ? (
                        <LoaderCircle className="w-4 h-4 animate-spin inline mr-2" />
                      ) : null}
                      Save Password
                    </button>
                    <button
                      onClick={() => {
                        setIsChangePasswordVisible(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      disabled={updatePasswordMutation.isPending}
                      className="p-2 bg-gray-300 font-medium cursor-pointer text-black hover:bg-gray-400 transition-colors px-4 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                  <input
                    value="********"
                    readOnly
                    type="password"
                    className="text-black font-semibold rounded-md p-2 border border-transparent text-[16px] bg-transparent"
                  />
                  <button
                    onClick={() => setIsChangePasswordVisible(true)}
                    className="p-2 lg:ml-5 bg-[rgba(217,217,217,0.87)] font-medium text-black hover:bg-gray-300 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>

            {/* Notification Interval Section */}
            <div className="flex md:flex-row flex-col gap-y-2 justify-start md:items-center gap-3">
              <label
                htmlFor="notification-interval"
                className="text-[rgba(0,0,0,0.7)] font-semibold text-[15px]"
              >
                Message notification interval via email:
              </label>
              <div className="relative">
                <select
                  id="notification-interval"
                  value={selectedValue}
                  onChange={handleIntervalChange}
                  disabled={updateNotificationIntervalMutation.isPending}
                  className="border border-gray-300 p-2 rounded-md w-fit bg-blue-400 pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {`Current: ${
                      user?.messageNotificationInterval === 0
                        ? "Don't Send"
                        : user?.messageNotificationInterval === 60
                        ? "After 1 hr"
                        : `After ${user?.messageNotificationInterval} mins`
                    }`}
                  </option>
                  <option value="0">Don't Send</option>
                  <option value="5">After 5 mins</option>
                  <option value="15">After 15 mins</option>
                  <option value="30">After 30 mins</option>
                  <option value="60">After 1 hr</option>
                </select>
                {updateNotificationIntervalMutation.isPending && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <LoaderCircle className="w-4 h-4 animate-spin text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;