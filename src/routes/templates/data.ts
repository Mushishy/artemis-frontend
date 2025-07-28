export interface Template {
    name: string;
    status: boolean;
}

// Built true 
// Not Built false

export const templates: Template[] = [
    {
        name: "debian-11-x64-server-template",
        status: false,
    },
    {
        name: "debian-11-x64-server-template",
        status: false,
    },
    {
        name: "debian-12-x64-server-template",
        status: true,
    },
    {
        name: "ubuntu-22.04-x64-server-template",
        status: true,
    },
    {
        name: "ubuntu-24.04-x64-server-template",
        status: true,
    },
    {
        name: "kali-2024.1-x64-desktop-template",
        status: true,
    },
    {
        name: "kali-x64-desktop-template",
        status: true,
    },
    {
        name: "win11-22h2-x64-enterprise-template",
        status: true,
    },
    {
        name: "win2022-server-x64-template",
        status: true,
    },
    {
        name: "centos-8-x64-server-template",
        status: false,
    },
    {
        name: "fedora-39-x64-desktop-template",
        status: true,
    }
];