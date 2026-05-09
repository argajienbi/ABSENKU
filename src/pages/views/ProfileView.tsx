import React from 'react';
import { useUserAppContext } from './UserAppContext';
import { ProfileMenu } from './profile/ProfileMenu';
import { ProfileIdCard } from './profile/ProfileIdCard';
import { ProfileChangelog } from './profile/ProfileChangelog';
import { ProfileEdit } from './profile/ProfileEdit';

export const ProfileView = () => {
  const { profileTab } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto">
        {profileTab === "menu" && <ProfileMenu />}
        {profileTab === "id-card" && <ProfileIdCard />}
        {profileTab === "changelog" && <ProfileChangelog />}
        {profileTab === "edit-profile" && <ProfileEdit />}
    </div>
  );
};
