
import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../settingsObject";
import { useDashboardData } from "../hooks/useDashboardData";
import { auth } from "../lib/firebase";
import { LiveMap } from "../components/LiveMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { MapPin, Settings, Users, Activity, LogOut, Briefcase, ClipboardList, BookOpen, ShieldAlert, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

import { SHIFTS } from "../constants";

// Lazy Loaded Components
const PerformanceAnalytics = lazy(() => import("../components/Analytics").then(m => ({ default: m.PerformanceAnalytics })));
const RekapAbsensi = lazy(() => import("../components/RekapAbsensi").then(m => ({ default: m.RekapAbsensi })));
const OverviewTab = lazy(() => import("./dashboard/OverviewTab").then(m => ({ default: m.OverviewTab })));
const UsersTab = lazy(() => import("./dashboard/UsersTab").then(m => ({ default: m.UsersTab })));
const AnnouncementsTab = lazy(() => import("./dashboard/AnnouncementsTab").then(m => ({ default: m.AnnouncementsTab })));
const SettingsLocationTab = lazy(() => import("./dashboard/SettingsLocationTab").then(m => ({ default: m.SettingsLocationTab })));
const SettingsShiftTab = lazy(() => import("./dashboard/SettingsShiftTab").then(m => ({ default: m.SettingsShiftTab })));
const SettingsSystemTab = lazy(() => import("./dashboard/SettingsSystemTab").then(m => ({ default: m.SettingsSystemTab })));
const LogsTab = lazy(() => import("./dashboard/LogsTab").then(m => ({ default: m.LogsTab })));
const GuideTab = lazy(() => import("./dashboard/GuideTab").then(m => ({ default: m.GuideTab })));

const ApprovalsTab = lazy(() => import("./dashboard/ApprovalsTab").then(m => ({ default: m.ApprovalsTab })));

// New Dialog Components
const MemberCardDialog = lazy(() => import("./dashboard/MemberCardDialog").then(m => ({ default: m.MemberCardDialog })));
const ManualOvertimeDialog = lazy(() => import("./dashboard/ManualOvertimeDialog").then(m => ({ default: m.ManualOvertimeDialog })));
const KoreksiAlpaDialog = lazy(() => import("./dashboard/KoreksiAlpaDialog").then(m => ({ default: m.KoreksiAlpaDialog })));
const EditUserDialog = lazy(() => import("./dashboard/EditUserDialog").then(m => ({ default: m.EditUserDialog })));
const ConfirmDeleteDialog = lazy(() => import("./dashboard/ConfirmDeleteDialog").then(m => ({ default: m.ConfirmDeleteDialog })));

const TabLoading = () => (
  <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sistem sedang memuat data...</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const {
    attendances, usersList, loadingConfig, idRefsList, announcements, securityLogs,
    toggleGeofence, saveSettings, publishAnnouncement, deleteAnnouncement,
    deleteUser, saveUserChanges, submitKoreksiAlpa, saveManualOvertime,
    handleDeleteAllHistory, handleDeleteUserHistory
  } = useDashboardData(user, settings);

  const [activeTab, setActiveTab] = useState("overview");

  // Local UI States moved from Dashboard or kept here
  const [selectedUserForCard, setSelectedUserForCard] = useState<any | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  
  // Settings Inputs
  const [appNameInput, setAppNameInput] = useState("ABSENKU");
  const [appLogoUrlInput, setAppLogoUrlInput] = useState("");
  const [useGoogleMapsInput, setUseGoogleMapsInput] = useState(false);
  const [googleMapsApiKeyInput, setGoogleMapsApiKeyInput] = useState("");
  const [shiftsInput, setShiftsInput] = useState<any>({});
  const [holidaysInput, setHolidaysInput] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState("");

  // Edit User details
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState(""); // Backward compatibility
  const [editAppRole, setEditAppRole] = useState("user");
  const [editJobRole, setEditJobRole] = useState("staff");
  const [editShift, setEditShift] = useState("");
  const [editUniqueId, setEditUniqueId] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editSubArea, setEditSubArea] = useState("");
  const [editIsBanned, setEditIsBanned] = useState(false);
  const [editBypassGeofence, setEditBypassGeofence] = useState(false);
  const [editWorkStartDate, setEditWorkStartDate] = useState("");
  const [editWorkEndDate, setEditWorkEndDate] = useState("");
  const [editMonthlyShifts, setEditMonthlyShifts] = useState<Record<string, string>>({});
  const [editWeeklyShiftPattern, setEditWeeklyShiftPattern] = useState<string[]>([]);

  // Announcement Inputs
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");

  // Overtime Inputs
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeUser, setOvertimeUser] = useState<any>(null);
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeStartTime, setOvertimeStartTime] = useState("");
  const [overtimeEndTime, setOvertimeEndTime] = useState("");
  const [overtimeNotes, setOvertimeNotes] = useState("");

  // Koreksi Inputs
  const [showKoreksiModal, setShowKoreksiModal] = useState(false);
  const [koreksiUser, setKoreksiUser] = useState<any>(null);
  const [koreksiDate, setKoreksiDate] = useState("");
  const [koreksiNotes, setKoreksiNotes] = useState("Dispensasi sistem/database error");

  // Confirm Delete
  const [confirmDeleteGlobal, setConfirmDeleteGlobal] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (settings) {
      setAppNameInput(settings.appName || "ABSENKU");
      setAppLogoUrlInput(settings.appLogoUrl || "");
      setUseGoogleMapsInput(settings.useGoogleMaps ?? false);
      setGoogleMapsApiKeyInput(settings.googleMapsApiKey || "");
      setShiftsInput(settings.shifts && Object.keys(settings.shifts).length > 0 ? settings.shifts : SHIFTS);
      setHolidaysInput(settings.holidays || []);
    }
  }, [settings]);

  const isSuperAdmin = user?.appRole === 'superadmin' || user?.role === 'superadmin';

  const handleEditUser = (user: any) => {
    setSelectedUserForEdit(user);
    setEditName(user.name || "");
    setEditRole(user.role || "");
    setEditAppRole(user.appRole || (['superadmin', 'admin', 'demo'].includes(user.role) ? user.role : 'user'));
    setEditJobRole(user.jobRole || (['superadmin', 'admin', 'demo'].includes(user.role) ? 'admin_pt' : user.role || 'staff'));
    setEditShift(user.shiftId || "shift1");
    setEditUniqueId(user.uniqueId || "");
    setEditArea(user.areaId || "global");
    setEditCompany(user.companyId || "global");
    setEditBranch(user.branchId || "global");
    setEditSubArea(user.subareaId || "global");
    setEditIsBanned(user.isBanned || false);
    setEditBypassGeofence(user.bypassGeofence || false);
    setEditWorkStartDate(user.workStartDate ? format(new Date(user.workStartDate), "yyyy-MM-dd") : "");
    setEditWorkEndDate(user.workEndDate ? format(new Date(user.workEndDate), "yyyy-MM-dd") : "");
    setEditMonthlyShifts(user.monthlyShifts || {});
    setEditWeeklyShiftPattern(user.weeklyShiftPattern || []);
  };

  const filteredUsersList = (isSuperAdmin || user?.appRole === 'demo' || user?.role === 'demo')
    ? usersList 
    : usersList.filter(u => {
        if (user?.companyId && user?.companyId !== 'global') {
          return u.companyId === user.companyId;
        }
        return true;
      });
  
  const filteredUsersRecordIds = new Set(filteredUsersList.map(u => u.uid || u.id));
  const filteredAttendances = user?.role === 'superadmin'
    ? attendances
    : attendances.filter(a => filteredUsersRecordIds.has(a.userId));

  return (
    <div className="flex bg-slate-50 dark:bg-gray-950 min-h-screen font-sans pt-[50px]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 sticky top-[50px] h-[calc(100vh-50px)] z-50 shrink-0 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-gray-800 flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-inner">
             {settings?.appLogoUrl ? (
                <img src={settings.appLogoUrl} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
              ) : (
                <Activity className="w-6 h-6 text-white" />
              )}
           </div>
           <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-tight text-teal-900 dark:text-white leading-none truncate">{settings?.appName || "ABSENKU"}</h1>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1 no-scrollbar">
          {[
            { value: "overview", label: "Overview", icon: Activity },
            { value: "approvals", label: "Persetujuan", icon: CheckCircle2 },
            { value: "users", label: "User Management", icon: Users },
            { value: "live-map", label: "Peta & Lokasi", icon: MapPin },
            { value: "rekap", label: "Rekap Kehadiran", icon: ClipboardList },
            { value: "announcements", label: "Portal Informasi", icon: Briefcase },
            { value: "analytics", label: "Performance", icon: Activity },
            { value: "guide", label: "Buku Petunjuk", icon: BookOpen },
            ...(isSuperAdmin ? [
                { value: "settings-shift", label: "Pengaturan Shift", icon: Briefcase },
                { value: "settings-system", label: "Sistem & Branding", icon: Settings },
                { value: "logs", label: "Log Keamanan", icon: ShieldAlert }
            ] : []),
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 font-medium'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-gray-500'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
           <div className="mb-4 px-2 overflow-hidden">
             <p className="font-bold text-sm truncate text-slate-800 dark:text-gray-200">{user?.name}</p>
             <p className="text-xs text-teal-600 dark:text-teal-400 uppercase font-black tracking-widest">{user?.role}</p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" className="flex-1 rounded-xl font-bold bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:bg-teal-50 hover:text-teal-700" onClick={() => navigate('/app')}>App Absen</Button>
             <Button variant="outline" className="px-3 rounded-xl bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" onClick={() => auth.signOut()} title="Logout"><LogOut className="w-4 h-4" /></Button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full h-[calc(100vh-50px)] overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden w-[70%]">
               <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                 {settings?.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
                  ) : (
                    <Activity className="w-5 h-5 text-white" />
                  )}
               </div>
               <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{settings?.appName || "ABSENKU"} Admin</span>
            </div>
            <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="h-8 w-8 p-0 rounded-full bg-slate-100 dark:bg-gray-800"><Briefcase className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="h-8 w-8 p-0 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30"><LogOut className="w-4 h-4" /></Button>
            </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-gray-800 px-2 py-2 sticky top-[57px] z-40 shadow-sm overflow-x-auto no-scrollbar">
           <div className="flex gap-2 w-max px-2">
             {[
                { value: "overview", label: "Overview", icon: Activity },
                { value: "approvals", label: "Persetujuan", icon: CheckCircle2 },
                { value: "users", label: "User", icon: Users },
                { value: "live-map", label: "Lokasi", icon: MapPin },
                { value: "rekap", label: "Rekap", icon: ClipboardList },
                { value: "announcements", label: "Portal", icon: Briefcase },
                { value: "analytics", label: "Analytics", icon: Activity },
                { value: "guide", label: "Informasi", icon: BookOpen },
                ...(user?.role === 'superadmin' ? [
                    { value: "settings-shift", label: "Shift", icon: Briefcase },
                    { value: "settings-system", label: "Sistem", icon: Settings },
                    { value: "logs", label: "Log", icon: ShieldAlert }
                ] : []),
              ].map(item => {
                 const isActive = activeTab === item.value;
                 return (
                    <button
                      key={item.value}
                      onClick={() => setActiveTab(item.value)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${isActive ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-200 dark:border-teal-800' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700'}`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                 );
              })}
           </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full max-w-6xl mx-auto pb-12">
            <Suspense fallback={<TabLoading />}>
              <TabsContent value="overview">
                  <OverviewTab 
                      user={user} 
                      filteredAttendances={filteredAttendances} 
                      filteredUsersList={filteredUsersList} 
                      setConfirmDeleteGlobal={setConfirmDeleteGlobal} 
                  />
              </TabsContent>

              <TabsContent value="approvals">
                  <ApprovalsTab
                      user={user}
                      filteredAttendances={filteredAttendances}
                      usersList={usersList}
                  />
              </TabsContent>
              
              <TabsContent value="users">
                  <UsersTab 
                      user={user} 
                      filteredUsersList={filteredUsersList} 
                      setDeleteUserTarget={setDeleteUserTarget}
                      setSelectedUserForEdit={setSelectedUserForEdit}
                      setSelectedUserForCard={setSelectedUserForCard}
                      settings={settings}
                      shiftsInput={shiftsInput}
                      areasInput={settings?.areas}
                      handleEditUser={handleEditUser}
                      handleKoreksiAlpa={(u: any) => { setKoreksiUser(u); setKoreksiDate(format(new Date(), "yyyy-MM-dd")); setShowKoreksiModal(true); }}
                      handleAddManualOvertime={(u: any) => { setOvertimeUser(u); setOvertimeDate(format(new Date(), "yyyy-MM-dd")); setOvertimeStartTime("17:00"); setOvertimeEndTime("19:00"); setOvertimeNotes("Lembur tambahan dari admin"); setShowOvertimeModal(true); }}
                  />
              </TabsContent>

              <TabsContent value="announcements">
                <AnnouncementsTab
                      announcementTitle={announcementTitle} setAnnouncementTitle={setAnnouncementTitle}
                      announcementContent={announcementContent} setAnnouncementContent={setAnnouncementContent}
                      announcementType={announcementType} setAnnouncementType={setAnnouncementType}
                      announcements={announcements}
                      publishAnnouncement={() => publishAnnouncement(announcementTitle, announcementContent, announcementType).then(success => { if(success) { setAnnouncementTitle(""); setAnnouncementContent(""); }})}
                      deleteAnnouncement={deleteAnnouncement}
                      loadingConfig={loadingConfig}
                />
              </TabsContent>
              
              <TabsContent value="analytics">
                <PerformanceAnalytics attendances={filteredAttendances} usersList={filteredUsersList} />
              </TabsContent>

              {user?.appRole !== 'demo' && (
                <TabsContent value="live-map" className="space-y-6">
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shrink-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-xl font-black tracking-tight">Peta Pantauan Langsung</CardTitle>
                            <CardDescription className="text-blue-100 font-medium">Lokasi absen karyawan hari ini secara real-time</CardDescription>
                          </div>
                          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 flex-1 relative min-h-[500px] h-[60vh]">
                          {!settings?.googleMapsApiKey ? (
                              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-gray-900 border-2 border-indigo-50 dark:border-indigo-900/50">
                                <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
                                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">API Key Belum Diatur</h3>
                                <p className="text-sm text-slate-500 max-w-md mt-2">Silahkan lengkapi Google Maps API Key di menu Pengaturan untuk menggunakan fitur Peta Pantauan Langsung.</p>
                              </div>
                          ) : (
                            <LiveMap 
                              attendances={attendances} 
                              users={usersList} 
                              apiKey={settings.googleMapsApiKey}
                              useGoogleMaps={settings.useGoogleMaps}
                              center={{ 
                                lat: (settings?.subareas && Object.values(settings.subareas).length > 0 && (Object.values(settings.subareas)[0] as any).lat !== undefined) ? (Object.values(settings.subareas)[0] as any).lat! : -6.2088, 
                                lng: (settings?.subareas && Object.values(settings.subareas).length > 0 && (Object.values(settings.subareas)[0] as any).lng !== undefined) ? (Object.values(settings.subareas)[0] as any).lng! : 106.8456 
                              }}
                            />
                          )}
                      </CardContent>
                    </Card>

                    <SettingsLocationTab 
                        settings={settings} loadingConfig={loadingConfig}
                        areas={settings?.areas} companies={settings?.companies} branches={settings?.branches} subareas={settings?.subareas}
                        toggleGeofence={toggleGeofence} user={user}
                    />
                </TabsContent>
              )}

              <TabsContent value="rekap">
                <RekapAbsensi usersList={filteredUsersList} settings={settings} />
              </TabsContent>

              {isSuperAdmin && (
                <>
                  <TabsContent value="settings-shift">
                      <SettingsShiftTab
                          loadingConfig={loadingConfig} shiftsInput={shiftsInput}
                          setShiftsInput={setShiftsInput} holidaysInput={holidaysInput}
                          setHolidaysInput={setHolidaysInput} newHoliday={newHoliday}
                          setNewHoliday={setNewHoliday} 
                          saveSettings={() => saveSettings({ shifts: shiftsInput, holidays: holidaysInput })}
                      />
                  </TabsContent>

                  <TabsContent value="settings-system">
                      <SettingsSystemTab
                          loadingConfig={loadingConfig} appNameInput={appNameInput}
                          setAppNameInput={setAppNameInput} appLogoUrlInput={appLogoUrlInput}
                          setAppLogoUrlInput={setAppLogoUrlInput} 
                          useGoogleMapsInput={useGoogleMapsInput} setUseGoogleMapsInput={setUseGoogleMapsInput}
                          googleMapsApiKeyInput={googleMapsApiKeyInput}
                          setGoogleMapsApiKeyInput={setGoogleMapsApiKeyInput}
                          saveSettings={() => saveSettings({ 
                            appName: appNameInput, 
                            appLogoUrl: appLogoUrlInput, 
                            useGoogleMaps: useGoogleMapsInput,
                            googleMapsApiKey: googleMapsApiKeyInput 
                          })} 
                          user={user} idRefsList={idRefsList}
                      />
                  </TabsContent>
                    
                  <TabsContent value="logs">
                      <LogsTab securityLogs={securityLogs} />
                  </TabsContent>
                </>
              )}

              <TabsContent value="guide">
                <GuideTab />
              </TabsContent>
            </Suspense>
          </Tabs>

          {/* Dialogs Components moved to separate files */}
          <Suspense fallback={null}>
            <MemberCardDialog 
              selectedUserForCard={selectedUserForCard} 
              setSelectedUserForCard={setSelectedUserForCard} 
              settings={settings} shiftsInput={shiftsInput} 
            />

            <ManualOvertimeDialog 
              showOvertimeModal={showOvertimeModal} setShowOvertimeModal={setShowOvertimeModal}
              overtimeUser={overtimeUser} overtimeDate={overtimeDate} setOvertimeDate={setOvertimeDate}
              overtimeStartTime={overtimeStartTime} setOvertimeStartTime={setOvertimeStartTime}
              overtimeEndTime={overtimeEndTime} setOvertimeEndTime={setEditWorkEndDate}
              overtimeNotes={overtimeNotes} setOvertimeNotes={setOvertimeNotes}
              saveManualOvertime={() => saveManualOvertime(overtimeUser, overtimeDate, overtimeStartTime, overtimeEndTime, overtimeNotes).then(s => s && setShowOvertimeModal(false))}
            />

            <KoreksiAlpaDialog 
              showKoreksiModal={showKoreksiModal} setShowKoreksiModal={setShowKoreksiModal}
              koreksiUser={koreksiUser} koreksiDate={koreksiDate} setKoreksiDate={setKoreksiDate}
              koreksiNotes={koreksiNotes} setKoreksiNotes={setKoreksiNotes}
              submitKoreksiAlpa={() => submitKoreksiAlpa(koreksiUser, koreksiDate, koreksiNotes).then(s => s && setShowKoreksiModal(false))}
            />

            <EditUserDialog 
              selectedUserForEdit={selectedUserForEdit} setSelectedUserForEdit={setSelectedUserForEdit}
              editName={editName} setEditName={setEditName} 
              editRole={editRole} setEditRole={setEditRole}
              editAppRole={editAppRole} setEditAppRole={setEditAppRole}
              editJobRole={editJobRole} setEditJobRole={setEditJobRole}
              editCompany={editCompany} setEditCompany={setEditCompany} editArea={editArea} setEditArea={setEditArea}
              editBranch={editBranch} setEditBranch={setEditBranch} editSubArea={editSubArea} setEditSubArea={setEditSubArea}
              editShift={editShift} setEditShift={setEditShift} editUniqueId={editUniqueId} setEditUniqueId={setEditUniqueId}
              editWorkStartDate={editWorkStartDate} setEditWorkStartDate={setEditWorkStartDate}
              editWorkEndDate={editWorkEndDate} setEditWorkEndDate={setEditWorkEndDate}
              editWeeklyShiftPattern={editWeeklyShiftPattern} setEditWeeklyShiftPattern={setEditWeeklyShiftPattern}
              editMonthlyShifts={editMonthlyShifts} setEditMonthlyShifts={setEditMonthlyShifts}
              editIsBanned={editIsBanned} setEditIsBanned={setEditIsBanned}
              editBypassGeofence={editBypassGeofence} setEditBypassGeofence={setEditBypassGeofence}
              saveUserChanges={() => saveUserChanges(selectedUserForEdit.id, {
                name: editName, 
                role: editRole, // Keep for legacy
                appRole: editAppRole,
                jobRole: editJobRole,
                shiftId: editShift, 
                uniqueId: editUniqueId,
                areaId: editArea === "global" ? null : editArea,
                companyId: editCompany === "global" ? null : editCompany,
                branchId: editBranch === "global" ? null : editBranch,
                subareaId: editSubArea === "global" ? null : editSubArea,
                isBanned: editIsBanned,
                bypassGeofence: editBypassGeofence,
                workStartDate: editWorkStartDate ? new Date(editWorkStartDate).getTime() : null,
                workEndDate: editWorkEndDate ? new Date(editWorkEndDate).getTime() : null,
                monthlyShifts: editMonthlyShifts,
                weeklyShiftPattern: editWeeklyShiftPattern
              }).then(s => s && setSelectedUserForEdit(null))}
              deleteUser={() => deleteUser(selectedUserForEdit).then(s => s && setSelectedUserForEdit(null))}
              settings={settings} shiftsInput={shiftsInput} currentUser={user}
            />

            <ConfirmDeleteDialog 
              open={confirmDeleteGlobal} onOpenChange={setConfirmDeleteGlobal}
              title="Peringatan Penghapusan"
              description={<>Anda akan menghapus <strong className="text-rose-600">SEMUA</strong> riwayat absensi dari seluruh user. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?</>}
              onConfirm={() => handleDeleteAllHistory().then(s => s && setConfirmDeleteGlobal(false))}
              confirmLabel="Ya, Hapus Semua"
            />

            <ConfirmDeleteDialog 
              open={!!deleteUserTarget} onOpenChange={(open) => !open && setDeleteUserTarget(null)}
              title="Peringatan Penghapusan"
              description={<>Hapus semua riwayat absensi untuk user <strong className="text-rose-600">{deleteUserTarget?.name}</strong>? Tindakan ini tidak bisa dibatalkan.</>}
              onConfirm={() => handleDeleteUserHistory(deleteUserTarget).then(s => s && setDeleteUserTarget(null))}
              confirmLabel="Ya, Hapus Riwayat"
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
