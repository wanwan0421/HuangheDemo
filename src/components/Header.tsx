import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6">
        <nav style={{ display: "flex", gap: "20px", padding: "10px" }}>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/dashboard">Dashboard</Link>
        </nav> 
    </header>
  );
}
