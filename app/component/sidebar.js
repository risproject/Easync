"use client";
import { useState, useEffect } from "react";
import { RiHome3Fill, RiBarChartFill, RiAlertFill, RiSettings3Fill, } from "react-icons/ri";
import { DiJqueryLogo } from "react-icons/di";
import { VscListSelection } from "react-icons/vsc";
import { PiCircuitryFill } from "react-icons/pi";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && expanded) setExpanded(false);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = () => setExpanded(!expanded);
    const closeSidebar = () => { if (isMobile) setExpanded(false); };

    return (
        <>
            {isMobile && expanded && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={closeSidebar} />
            )}
            <aside className={`bg-teal-600 text-white h-screen top-0 overflow-y-auto md:sticky flex flex-col justify-between transition-all duration-300 z-60 shadow-lg ${isMobile ? 'fixed' : 'relative'} ${expanded ? "w-64" : "w-15"}`}>

                {/* Header */}
                <div className="px-2">
                    <div style={{ minHeight: '60px' }} className="flex items-center my-2">
                        <button onClick={toggleSidebar} className="rounded-full hover:bg-teal-700/70 p-2 m-1 transition-colors shrink-0 cursor-pointer">
                            <VscListSelection size={20} />
                        </button>
                        {expanded && (
                            <div className="flex items-center flex-1 ml-2 min-w-0 gap-1">
                                <span className="bg-white p-1 rounded text-black">
                                    <DiJqueryLogo size={18} />
                                </span>
                                <span className="font-semibold truncate">FR-6000</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex flex-col flex-1 px-2 space-y-1">
                    <MenuItem icon={<RiHome3Fill size={20} />} label="Beranda" href="/" expanded={expanded} onClick={closeSidebar} />
                    <MenuItem icon={<RiBarChartFill size={20} />} label="Statistik" href="/statistik" expanded={expanded} onClick={closeSidebar} />
                    <MenuItem icon={<RiAlertFill size={20} />} label="Informasi" href="/informasi" expanded={expanded} onClick={closeSidebar} />
                    <MenuItem icon={<PiCircuitryFill size={20} />} label="Sensor" href="/sensor" expanded={expanded} onClick={closeSidebar} />
                    <MenuItem icon={<RiSettings3Fill size={20} />} label="Setelan" href="/setelan" expanded={expanded} onClick={closeSidebar} />
                </nav>
            </aside>
        </>
    );
}

function MenuItem({ icon, label, href, expanded, onClick }) {
    const pathname = usePathname();
    const active = pathname === href;

    return (
        <a href={href} onClick={onClick} className={`flex items-center rounded-lg transition-colors ${expanded ? "justify-start gap-5 px-3 py-3" : "justify-center p-3"} ${active ? "bg-teal-700" : "hover:bg-teal-700/70"}`}>
            <span className="flex items-center justify-center w-5 h-5 shrink-0">
                {icon}
            </span>
            {expanded && <span className="text-sm whitespace-nowrap truncate">{label}</span>}
        </a>
    );
}