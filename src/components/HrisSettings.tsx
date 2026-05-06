import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { collection, doc, setDoc, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export const HrisSettings: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      const snapshot = await getDocs(collection(db, 'companies'));
      if (!snapshot.empty) {
        setCompanyName(snapshot.docs[0].data().name);
      }
    };
    fetchCompany();
  }, []);

  const saveCompany = async () => {
    setLoading(true);
    try {
      const companyRef = doc(collection(db, 'companies'), 'main');
      await setDoc(companyRef, { name: companyName });
      toast.success('Nama PT berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan nama PT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Masukkan Nama PT"
          />
          <Button onClick={saveCompany} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Nama PT'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Division and Shift Manager sections will go under here */}
      <Card>
          <CardHeader>
              <CardTitle>Divisi & Shift (Segera Hadir)</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-gray-500">Fitur sedang dalam pengembangan...</p>
          </CardContent>
      </Card>
    </div>
  );
};
