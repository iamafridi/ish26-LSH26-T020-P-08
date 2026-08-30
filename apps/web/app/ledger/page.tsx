import Dashboard from "../page";

export const metadata = {
  title: "Student Ledger — ResultIQ",
  description: "Search, filter, and inspect verified student results.",
};

export default function LedgerPage() {
  return <Dashboard initialTab="results" />;
}
