const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/OverviewTab.tsx', 'utf-8');

// Replace TabsContent with a div
content = content.replace(/<TabsContent value="overview"[^>]*>/, '<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">');
content = content.replace(/<\/TabsContent>$/, '</div>');

const addedImports = `
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SHIFTS } from "../../constants";
import { deleteFileFromStorage } from "../../lib/storage";
import { CheckCircle2 } from "lucide-react";
`;

content = content.replace("import { format } from \"date-fns\";", "import { format } from \"date-fns\";\n" + addedImports);

// Fix "attendances" variable referenced at line 329
content = content.replace(/attendances\.length === 0/g, 'filteredAttendances.length === 0');
content = content.replace(/attendances\.map/g, 'filteredAttendances.map');

fs.writeFileSync('src/pages/dashboard/OverviewTab.tsx', content);

console.log("fixed overview tab imports");
