import React, { createContext, useContext } from 'react';

const UserAppContext = createContext<any>(null);

export const useUserAppContext = () => useContext(UserAppContext);

export const UserAppProvider = ({ children, value }: { children: React.ReactNode, value: any }) => (
  <UserAppContext.Provider value={value}>
    {children}
  </UserAppContext.Provider>
);
