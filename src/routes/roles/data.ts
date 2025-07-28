export interface Role {
    Name: string;
    Version: string;
    Type: "role" | "collection";
    Global: boolean;
}

// (unknown version -> custom

export const roles: Role[] = [
    {
        Name: "badsectorlabs.ludus_elastic_agent",
        Version: "1.0.4",
        Type: "role",
        Global: false
    },
    {
        Name: "geerlingguy.packer",
        Version: "1.0.2",
        Type: "role",
        Global: false
    },
    {
        Name: "ludus_ctf_debisuri_redteam",
        Version: "custom",
        Type: "role",
        Global: false
    },
    {
        Name: "ludus_ctf_debisuri_blueteam",
        Version: "custom",
        Type: "role",
        Global: false
    },
    {
        Name: "lae.proxmox",
        Version: "v1.8.0",
        Type: "role",
        Global: false
    },
    {
        Name: "ansible-thoteam.nexus3-oss",
        Version: "v2.5.2",
        Type: "role",
        Global: false
    },
    {
        Name: "ludus_redteam101_kali_configuration",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "badsectorlabs.ludus_elastic_container",
        Version: "1.1.1",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_mythic_teamserver",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_flag_distributor",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_redteam101_teamserver_fileserve",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_ctf_startup_victim",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_redteam101_teamserver_mythic",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_flag_creator",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_sb_w5_lin1",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_juiceshop",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_fiit_ctfd",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "badsectorlabs.ludus_elastic_agent",
        Version: "1.0.5",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_redteam101_1_windows_configuration",
        Version: "custom",
        Type: "role",
        Global: true
    },
    {
        Name: "ludus_adaptix_c2",
        Version: "1.1.0",
        Type: "role",
        Global: true
    },
    {
        Name: "geerlingguy.docker",
        Version: "7.1.0",
        Type: "role",
        Global: true
    },
    {
        Name: "community.general",
        Version: "10.3.0",
        Type: "collection",
        Global: false
    },
    {
        Name: "community.windows",
        Version: "2.3.0",
        Type: "collection",
        Global: false
    },
    {
        Name: "microsoft.ad",
        Version: "1.8.0",
        Type: "collection",
        Global: false
    },
    {
        Name: "vladgh.samba",
        Version: "3.4.0",
        Type: "collection",
        Global: false
    },
    {
        Name: "ansible.posix",
        Version: "1.6.2",
        Type: "collection",
        Global: false
    },
    {
        Name: "ansible.utils",
        Version: "5.1.2",
        Type: "collection",
        Global: false
    },
    {
        Name: "ansible.windows",
        Version: "2.7.0",
        Type: "collection",
        Global: false
    },
    {
        Name: "chocolatey.chocolatey",
        Version: "1.5.3",
        Type: "collection",
        Global: false
    }
];