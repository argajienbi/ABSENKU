const fs = require('fs');

let content = fs.readFileSync('src/pages/views/ProfileView.tsx', 'utf-8');

content = content.replace('Versi 3.9.13 (Terbaru)', 'Versi 3.9.14 (Terbaru)');

content = content.replace(
  '<h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.9.13 <span className="text-xs font-normal text-gray-500 ml-2">Baru saja</span></h5>',
  '<h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.13</h5>'
);

content = content.replace(
  '<div className="relative pl-4 border-l-2 border-teal-500">',
  '<div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">'
);
content = content.replace(
  '<div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20"></div>',
  '<div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>'
);

const newChangelog = `
                        <div className="relative pl-4 border-l-2 border-teal-500">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.9.14 <span className="text-xs font-normal text-gray-500 ml-2">Baru saja</span></h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Refactor Skala Besar: Memecah komponen raksasa Dashboard Admin (sebelumnya berukuran sangat masif) ke dalam lebih dari lima sub-komponen terpisah yang lebih kecil berdasarkan fungsi halamannya. Meningkatkan skalabilitas sistem dan meminimalkan error silang antar tabulasi admin.</li>
                          </ul>
                        </div>
`;

content = content.replace(
  '<div className="space-y-4">',
  '<div className="space-y-4">' + newChangelog
);

fs.writeFileSync('src/pages/views/ProfileView.tsx', content);
console.log('done');
