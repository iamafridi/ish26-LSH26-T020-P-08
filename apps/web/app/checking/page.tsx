import Dashboard from "../page";

export const metadata = {
  title: "Checking Lists — ResultIQ",
  description: "Review optional, practical, and absence audit lists.",
};

export default function CheckingPage() {
  return <Dashboard initialTab="checking" />;
}
