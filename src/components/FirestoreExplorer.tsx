import { useState, useEffect } from "react";
import { getDb } from "../lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function FirestoreExplorer() {
  const [status, setStatus] = useState<"loading" | "connected" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [testDoc, setTestDoc] = useState<any>(null);

  const db = getDb();

  const fetchData = async () => {
    setStatus("loading");
    setError(null);
    try {
      // Check connection
      await getDoc(doc(db, "settings", "telegram"));
      setStatus("connected");

      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch settings
      const settingsSnap = await getDoc(doc(db, "settings", "telegram"));
      setSettings(settingsSnap.data());
    } catch (e: any) {
      console.error(e);
      setStatus("failed");
      setError(e.code + ": " + e.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createTestDoc = async () => {
    try {
      const ref = doc(db, "debug", "test");
      await setDoc(ref, { status: "working", timestamp: Date.now() });
      const snap = await getDoc(ref);
      setTestDoc(snap.data());
    } catch (e: any) {
      alert("Error: " + e.code + " " + e.message);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-lg text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Firestore Explorer</h2>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">Refresh Data</button>
          <div className={`px-3 py-1 rounded text-sm ${status === "connected" ? "bg-green-900 text-green-200" : status === "failed" ? "bg-red-900 text-red-200" : "bg-yellow-900 text-yellow-200"}`}>
            {status === "connected" ? "Connected ✅" : status === "failed" ? "Failed ❌" : "Loading..."}
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-950 p-4 rounded">
          <h3 className="font-bold mb-2">Collections</h3>
          <ul className="list-disc pl-5">
            <li>users</li>
            <li>settings</li>
            <li>debug</li>
          </ul>
        </div>
        <div className="bg-slate-950 p-4 rounded">
            <h3 className="font-bold mb-2">Statistics</h3>
            <p>Total Users: {users.length}</p>
            <p>Total Files: N/A</p>
            <p>Total Downloads: N/A</p>
            <p>Total Earnings: N/A</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Users</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-2">Telegram ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Username</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Balance</th>
              <th className="p-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-2">{u.telegramId || u.id}</td>
                <td className="p-2">{u.firstName} {u.lastName}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.phone}</td>
                <td className="p-2">{u.balance}</td>
                <td className="p-2">{u.joinedAt?.toDate().toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Telegram Settings</h3>
        {settings ? (
          <pre className="bg-slate-950 p-4 rounded text-xs">{JSON.stringify({
            ...settings,
            botToken: settings.botToken ? "********" : "Not set"
          }, null, 2)}
          </pre>
        ) : <p>Loading...</p>}
      </div>

      <div className="mt-8">
        <button onClick={createTestDoc} className="px-4 py-2 bg-blue-900 text-blue-200 rounded hover:bg-blue-800">Create Test Document</button>
        {testDoc && <pre className="mt-4 bg-slate-950 p-4 rounded text-xs">{JSON.stringify(testDoc, null, 2)}</pre>}
      </div>
    </div>
  );
}
