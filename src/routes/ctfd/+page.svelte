<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import { RotateCcw, AlertCircle, CheckCircle2, X, Send, ChevronsUpDown, Check } from 'lucide-svelte';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { createCtfdTopology } from '$lib/api/topology.client';
    import { getScenariosDisplay } from '$lib/api/ctfd_scenario.client';
    import { loadPools as loadPoolsAPI } from '$lib/api/pools';

    // Form state with default values
    let config = $state({
        topologyName: "",
        scenarioId: "",
        poolId: "",
        
        usernameConfig: "admin",
        passwordConfig: "admin",
        adminUsername: "supervisor",
        adminPassword: "admin",
        
        ctfName: "",
        ctfDescription: "",
        challengeVisibility: "private" as const,
        accountVisibility: "private" as const,
        scoreVisibility: "private" as const,
        registrationVisibility: "private" as const,
        allowNameChanges: "no" as const,
        allowTeamCreation: "no" as const,
        allowTeamDisbanding: "no" as const,
        
        confStartTime: "",
        confStopTime: "",
        timeZone: "Europe/Vienna",
        allowViewingAfter: "yes" as const
    });

    // Alert state
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);
    let isSubmitting = $state(false);

    // Dropdown state
    let scenarioOpen = $state(false);
    let poolOpen = $state(false);
    let timezoneOpen = $state(false);
    let allowViewingAfterOpen = $state(false);
    let challengeVisibilityOpen = $state(false);
    let accountVisibilityOpen = $state(false);
    let scoreVisibilityOpen = $state(false);
    let registrationVisibilityOpen = $state(false);
    let allowNameChangesOpen = $state(false);
    let allowTeamCreationOpen = $state(false);
    let allowTeamDisbandingOpen = $state(false);
    let scenarioOptions = $state<{ value: string; label: string; description?: string }[]>([]);
    let poolOptions = $state<{ value: string; label: string; description?: string; poolId?: string }[]>([]);

    // Load scenarios and pools on component mount
    async function loadScenarios() {
        try {
            const scenarios = await getScenariosDisplay();
            scenarioOptions = scenarios.map(scenario => ({
                value: scenario.ID,
                label: scenario.Name,
                description: scenario.ID
            }));
        } catch (error) {
            console.error('Failed to load scenarios:', error);
            scenarioOptions = [];
            showAlert('Failed to load scenarios. Please refresh the page.', 'error');
        }
    }

    async function loadPools() {
        try {
            const pools = await loadPoolsAPI();
            poolOptions = pools.map(pool => ({
                value: pool.poolId,
                label: pool.note || 'No description',
                description: pool.note || 'No description',
                poolId: pool.poolId
            }));
        } catch (error) {
            console.error('Failed to load pools:', error);
            poolOptions = [];
            showAlert('Failed to load pools. Please refresh the page.', 'error');
        }
    }

    // Load data on mount
    loadScenarios();
    loadPools();

    // Timezone options (deduplicated to avoid duplicate key errors)
    const allTimezones = [
        { value: "Europe/Bratislava", label: "Europe/Bratislava" },
        { value: "Africa/Abidjan", label: "Africa/Abidjan" },
        { value: "Africa/Accra", label: "Africa/Accra" },
        { value: "Africa/Addis_Ababa", label: "Africa/Addis_Ababa" },
        { value: "Africa/Algiers", label: "Africa/Algiers" },
        { value: "Africa/Asmara", label: "Africa/Asmara" },
        { value: "Africa/Asmera", label: "Africa/Asmera" },
        { value: "Africa/Bamako", label: "Africa/Bamako" },
        { value: "Africa/Bangui", label: "Africa/Bangui" },
        { value: "Africa/Banjul", label: "Africa/Banjul" },
        { value: "Africa/Bissau", label: "Africa/Bissau" },
        { value: "Africa/Blantyre", label: "Africa/Blantyre" },
        { value: "Africa/Brazzaville", label: "Africa/Brazzaville" },
        { value: "Africa/Bujumbura", label: "Africa/Bujumbura" },
        { value: "Africa/Cairo", label: "Africa/Cairo" },
        { value: "Africa/Casablanca", label: "Africa/Casablanca" },
        { value: "Africa/Ceuta", label: "Africa/Ceuta" },
        { value: "Africa/Conakry", label: "Africa/Conakry" },
        { value: "Africa/Dakar", label: "Africa/Dakar" },
        { value: "Africa/Dar_es_Salaam", label: "Africa/Dar_es_Salaam" },
        { value: "Africa/Djibouti", label: "Africa/Djibouti" },
        { value: "Africa/Douala", label: "Africa/Douala" },
        { value: "Africa/El_Aaiun", label: "Africa/El_Aaiun" },
        { value: "Africa/Freetown", label: "Africa/Freetown" },
        { value: "Africa/Gaborone", label: "Africa/Gaborone" },
        { value: "Africa/Harare", label: "Africa/Harare" },
        { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
        { value: "Africa/Juba", label: "Africa/Juba" },
        { value: "Africa/Kampala", label: "Africa/Kampala" },
        { value: "Africa/Khartoum", label: "Africa/Khartoum" },
        { value: "Africa/Kigali", label: "Africa/Kigali" },
        { value: "Africa/Kinshasa", label: "Africa/Kinshasa" },
        { value: "Africa/Lagos", label: "Africa/Lagos" },
        { value: "Africa/Libreville", label: "Africa/Libreville" },
        { value: "Africa/Lome", label: "Africa/Lome" },
        { value: "Africa/Luanda", label: "Africa/Luanda" },
        { value: "Africa/Lubumbashi", label: "Africa/Lubumbashi" },
        { value: "Africa/Lusaka", label: "Africa/Lusaka" },
        { value: "Africa/Malabo", label: "Africa/Malabo" },
        { value: "Africa/Maputo", label: "Africa/Maputo" },
        { value: "Africa/Maseru", label: "Africa/Maseru" },
        { value: "Africa/Mbabane", label: "Africa/Mbabane" },
        { value: "Africa/Mogadishu", label: "Africa/Mogadishu" },
        { value: "Africa/Monrovia", label: "Africa/Monrovia" },
        { value: "Africa/Nairobi", label: "Africa/Nairobi" },
        { value: "Africa/Ndjamena", label: "Africa/Ndjamena" },
        { value: "Africa/Niamey", label: "Africa/Niamey" },
        { value: "Africa/Nouakchott", label: "Africa/Nouakchott" },
        { value: "Africa/Ouagadougou", label: "Africa/Ouagadougou" },
        { value: "Africa/Porto-Novo", label: "Africa/Porto-Novo" },
        { value: "Africa/Sao_Tome", label: "Africa/Sao_Tome" },
        { value: "Africa/Timbuktu", label: "Africa/Timbuktu" },
        { value: "Africa/Tripoli", label: "Africa/Tripoli" },
        { value: "Africa/Tunis", label: "Africa/Tunis" },
        { value: "Africa/Windhoek", label: "Africa/Windhoek" },
        { value: "America/Adak", label: "America/Adak" },
        { value: "America/Anchorage", label: "America/Anchorage" },
        { value: "America/Anguilla", label: "America/Anguilla" },
        { value: "America/Antigua", label: "America/Antigua" },
        { value: "America/Araguaina", label: "America/Araguaina" },
        { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires" },
        { value: "America/Argentina/Catamarca", label: "America/Argentina/Catamarca" },
        { value: "America/Argentina/ComodRivadavia", label: "America/Argentina/ComodRivadavia" },
        { value: "America/Argentina/Cordoba", label: "America/Argentina/Cordoba" },
        { value: "America/Argentina/Jujuy", label: "America/Argentina/Jujuy" },
        { value: "America/Argentina/La_Rioja", label: "America/Argentina/La_Rioja" },
        { value: "America/Argentina/Mendoza", label: "America/Argentina/Mendoza" },
        { value: "America/Argentina/Rio_Gallegos", label: "America/Argentina/Rio_Gallegos" },
        { value: "America/Argentina/Salta", label: "America/Argentina/Salta" },
        { value: "America/Argentina/San_Juan", label: "America/Argentina/San_Juan" },
        { value: "America/Argentina/San_Luis", label: "America/Argentina/San_Luis" },
        { value: "America/Argentina/Tucuman", label: "America/Argentina/Tucuman" },
        { value: "America/Argentina/Ushuaia", label: "America/Argentina/Ushuaia" },
        { value: "America/Aruba", label: "America/Aruba" },
        { value: "America/Asuncion", label: "America/Asuncion" },
        { value: "America/Atikokan", label: "America/Atikokan" },
        { value: "America/Atka", label: "America/Atka" },
        { value: "America/Bahia", label: "America/Bahia" },
        { value: "America/Bahia_Banderas", label: "America/Bahia_Banderas" },
        { value: "America/Barbados", label: "America/Barbados" },
        { value: "America/Belem", label: "America/Belem" },
        { value: "America/Belize", label: "America/Belize" },
        { value: "America/Blanc-Sablon", label: "America/Blanc-Sablon" },
        { value: "America/Boa_Vista", label: "America/Boa_Vista" },
        { value: "America/Bogota", label: "America/Bogota" },
        { value: "America/Boise", label: "America/Boise" },
        { value: "America/Buenos_Aires", label: "America/Buenos_Aires" },
        { value: "America/Cambridge_Bay", label: "America/Cambridge_Bay" },
        { value: "America/Campo_Grande", label: "America/Campo_Grande" },
        { value: "America/Cancun", label: "America/Cancun" },
        { value: "America/Caracas", label: "America/Caracas" },
        { value: "America/Catamarca", label: "America/Catamarca" },
        { value: "America/Cayenne", label: "America/Cayenne" },
        { value: "America/Cayman", label: "America/Cayman" },
        { value: "America/Chicago", label: "America/Chicago" },
        { value: "America/Chihuahua", label: "America/Chihuahua" },
        { value: "America/Coral_Harbour", label: "America/Coral_Harbour" },
        { value: "America/Cordoba", label: "America/Cordoba" },
        { value: "America/Costa_Rica", label: "America/Costa_Rica" },
        { value: "America/Creston", label: "America/Creston" },
        { value: "America/Cuiaba", label: "America/Cuiaba" },
        { value: "America/Curacao", label: "America/Curacao" },
        { value: "America/Danmarkshavn", label: "America/Danmarkshavn" },
        { value: "America/Dawson", label: "America/Dawson" },
        { value: "America/Dawson_Creek", label: "America/Dawson_Creek" },
        { value: "America/Denver", label: "America/Denver" },
        { value: "America/Detroit", label: "America/Detroit" },
        { value: "America/Dominica", label: "America/Dominica" },
        { value: "America/Edmonton", label: "America/Edmonton" },
        { value: "America/Eirunepe", label: "America/Eirunepe" },
        { value: "America/El_Salvador", label: "America/El_Salvador" },
        { value: "America/Ensenada", label: "America/Ensenada" },
        { value: "America/Fort_Nelson", label: "America/Fort_Nelson" },
        { value: "America/Fort_Wayne", label: "America/Fort_Wayne" },
        { value: "America/Fortaleza", label: "America/Fortaleza" },
        { value: "America/Glace_Bay", label: "America/Glace_Bay" },
        { value: "America/Godthab", label: "America/Godthab" },
        { value: "America/Goose_Bay", label: "America/Goose_Bay" },
        { value: "America/Grand_Turk", label: "America/Grand_Turk" },
        { value: "America/Grenada", label: "America/Grenada" },
        { value: "America/Guadeloupe", label: "America/Guadeloupe" },
        { value: "America/Guatemala", label: "America/Guatemala" },
        { value: "America/Guayaquil", label: "America/Guayaquil" },
        { value: "America/Guyana", label: "America/Guyana" },
        { value: "America/Halifax", label: "America/Halifax" },
        { value: "America/Havana", label: "America/Havana" },
        { value: "America/Hermosillo", label: "America/Hermosillo" },
        { value: "America/Indiana/Indianapolis", label: "America/Indiana/Indianapolis" },
        { value: "America/Indiana/Knox", label: "America/Indiana/Knox" },
        { value: "America/Indiana/Marengo", label: "America/Indiana/Marengo" },
        { value: "America/Indiana/Petersburg", label: "America/Indiana/Petersburg" },
        { value: "America/Indiana/Tell_City", label: "America/Indiana/Tell_City" },
        { value: "America/Indiana/Vevay", label: "America/Indiana/Vevay" },
        { value: "America/Indiana/Vincennes", label: "America/Indiana/Vincennes" },
        { value: "America/Indiana/Winamac", label: "America/Indiana/Winamac" },
        { value: "America/Indianapolis", label: "America/Indianapolis" },
        { value: "America/Inuvik", label: "America/Inuvik" },
        { value: "America/Iqaluit", label: "America/Iqaluit" },
        { value: "America/Jamaica", label: "America/Jamaica" },
        { value: "America/Jujuy", label: "America/Jujuy" },
        { value: "America/Juneau", label: "America/Juneau" },
        { value: "America/Kentucky/Louisville", label: "America/Kentucky/Louisville" },
        { value: "America/Kentucky/Monticello", label: "America/Kentucky/Monticello" },
        { value: "America/Knox_IN", label: "America/Knox_IN" },
        { value: "America/Kralendijk", label: "America/Kralendijk" },
        { value: "America/La_Paz", label: "America/La_Paz" },
        { value: "America/Lima", label: "America/Lima" },
        { value: "America/Los_Angeles", label: "America/Los_Angeles" },
        { value: "America/Louisville", label: "America/Louisville" },
        { value: "America/Lower_Princes", label: "America/Lower_Princes" },
        { value: "America/Maceio", label: "America/Maceio" },
        { value: "America/Managua", label: "America/Managua" },
        { value: "America/Manaus", label: "America/Manaus" },
        { value: "America/Marigot", label: "America/Marigot" },
        { value: "America/Martinique", label: "America/Martinique" },
        { value: "America/Matamoros", label: "America/Matamoros" },
        { value: "America/Mazatlan", label: "America/Mazatlan" },
        { value: "America/Mendoza", label: "America/Mendoza" },
        { value: "America/Menominee", label: "America/Menominee" },
        { value: "America/Merida", label: "America/Merida" },
        { value: "America/Metlakatla", label: "America/Metlakatla" },
        { value: "America/Mexico_City", label: "America/Mexico_City" },
        { value: "America/Miquelon", label: "America/Miquelon" },
        { value: "America/Moncton", label: "America/Moncton" },
        { value: "America/Monterrey", label: "America/Monterrey" },
        { value: "America/Montevideo", label: "America/Montevideo" },
        { value: "America/Montreal", label: "America/Montreal" },
        { value: "America/Montserrat", label: "America/Montserrat" },
        { value: "America/Nassau", label: "America/Nassau" },
        { value: "America/New_York", label: "America/New_York" },
        { value: "America/Nipigon", label: "America/Nipigon" },
        { value: "America/Nome", label: "America/Nome" },
        { value: "America/Noronha", label: "America/Noronha" },
        { value: "America/North_Dakota/Beulah", label: "America/North_Dakota/Beulah" },
        { value: "America/North_Dakota/Center", label: "America/North_Dakota/Center" },
        { value: "America/North_Dakota/New_Salem", label: "America/North_Dakota/New_Salem" },
        { value: "America/Nuuk", label: "America/Nuuk" },
        { value: "America/Ojinaga", label: "America/Ojinaga" },
        { value: "America/Panama", label: "America/Panama" },
        { value: "America/Pangnirtung", label: "America/Pangnirtung" },
        { value: "America/Paramaribo", label: "America/Paramaribo" },
        { value: "America/Phoenix", label: "America/Phoenix" },
        { value: "America/Port-au-Prince", label: "America/Port-au-Prince" },
        { value: "America/Port_of_Spain", label: "America/Port_of_Spain" },
        { value: "America/Porto_Acre", label: "America/Porto_Acre" },
        { value: "America/Porto_Velho", label: "America/Porto_Velho" },
        { value: "America/Puerto_Rico", label: "America/Puerto_Rico" },
        { value: "America/Punta_Arenas", label: "America/Punta_Arenas" },
        { value: "America/Rainy_River", label: "America/Rainy_River" },
        { value: "America/Rankin_Inlet", label: "America/Rankin_Inlet" },
        { value: "America/Recife", label: "America/Recife" },
        { value: "America/Regina", label: "America/Regina" },
        { value: "America/Resolute", label: "America/Resolute" },
        { value: "America/Rio_Branco", label: "America/Rio_Branco" },
        { value: "America/Rosario", label: "America/Rosario" },
        { value: "America/Santa_Isabel", label: "America/Santa_Isabel" },
        { value: "America/Santarem", label: "America/Santarem" },
        { value: "America/Santiago", label: "America/Santiago" },
        { value: "America/Santo_Domingo", label: "America/Santo_Domingo" },
        { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
        { value: "America/Scoresbysund", label: "America/Scoresbysund" },
        { value: "America/Shiprock", label: "America/Shiprock" },
        { value: "America/Sitka", label: "America/Sitka" },
        { value: "America/St_Barthelemy", label: "America/St_Barthelemy" },
        { value: "America/St_Johns", label: "America/St_Johns" },
        { value: "America/St_Kitts", label: "America/St_Kitts" },
        { value: "America/St_Lucia", label: "America/St_Lucia" },
        { value: "America/St_Thomas", label: "America/St_Thomas" },
        { value: "America/St_Vincent", label: "America/St_Vincent" },
        { value: "America/Swift_Current", label: "America/Swift_Current" },
        { value: "America/Tegucigalpa", label: "America/Tegucigalpa" },
        { value: "America/Thule", label: "America/Thule" },
        { value: "America/Thunder_Bay", label: "America/Thunder_Bay" },
        { value: "America/Tijuana", label: "America/Tijuana" },
        { value: "America/Toronto", label: "America/Toronto" },
        { value: "America/Tortola", label: "America/Tortola" },
        { value: "America/Vancouver", label: "America/Vancouver" },
        { value: "America/Virgin", label: "America/Virgin" },
        { value: "America/Whitehorse", label: "America/Whitehorse" },
        { value: "America/Winnipeg", label: "America/Winnipeg" },
        { value: "America/Yakutat", label: "America/Yakutat" },
        { value: "America/Yellowknife", label: "America/Yellowknife" },
        { value: "Antarctica/Casey", label: "Antarctica/Casey" },
        { value: "Antarctica/Davis", label: "Antarctica/Davis" },
        { value: "Antarctica/DumontDUrville", label: "Antarctica/DumontDUrville" },
        { value: "Antarctica/Macquarie", label: "Antarctica/Macquarie" },
        { value: "Antarctica/Mawson", label: "Antarctica/Mawson" },
        { value: "Antarctica/McMurdo", label: "Antarctica/McMurdo" },
        { value: "Antarctica/Palmer", label: "Antarctica/Palmer" },
        { value: "Antarctica/Rothera", label: "Antarctica/Rothera" },
        { value: "Antarctica/South_Pole", label: "Antarctica/South_Pole" },
        { value: "Antarctica/Syowa", label: "Antarctica/Syowa" },
        { value: "Antarctica/Troll", label: "Antarctica/Troll" },
        { value: "Antarctica/Vostok", label: "Antarctica/Vostok" },
        { value: "Arctic/Longyearbyen", label: "Arctic/Longyearbyen" },
        { value: "Asia/Aden", label: "Asia/Aden" },
        { value: "Asia/Almaty", label: "Asia/Almaty" },
        { value: "Asia/Amman", label: "Asia/Amman" },
        { value: "Asia/Anadyr", label: "Asia/Anadyr" },
        { value: "Asia/Aqtau", label: "Asia/Aqtau" },
        { value: "Asia/Aqtobe", label: "Asia/Aqtobe" },
        { value: "Asia/Ashgabat", label: "Asia/Ashgabat" },
        { value: "Asia/Ashkhabad", label: "Asia/Ashkhabad" },
        { value: "Asia/Atyrau", label: "Asia/Atyrau" },
        { value: "Asia/Baghdad", label: "Asia/Baghdad" },
        { value: "Asia/Bahrain", label: "Asia/Bahrain" },
        { value: "Asia/Baku", label: "Asia/Baku" },
        { value: "Asia/Bangkok", label: "Asia/Bangkok" },
        { value: "Asia/Barnaul", label: "Asia/Barnaul" },
        { value: "Asia/Beirut", label: "Asia/Beirut" },
        { value: "Asia/Bishkek", label: "Asia/Bishkek" },
        { value: "Asia/Brunei", label: "Asia/Brunei" },
        { value: "Asia/Calcutta", label: "Asia/Calcutta" },
        { value: "Asia/Chita", label: "Asia/Chita" },
        { value: "Asia/Choibalsan", label: "Asia/Choibalsan" },
        { value: "Asia/Chongqing", label: "Asia/Chongqing" },
        { value: "Asia/Chungking", label: "Asia/Chungking" },
        { value: "Asia/Colombo", label: "Asia/Colombo" },
        { value: "Asia/Dacca", label: "Asia/Dacca" },
        { value: "Asia/Damascus", label: "Asia/Damascus" },
        { value: "Asia/Dhaka", label: "Asia/Dhaka" },
        { value: "Asia/Dili", label: "Asia/Dili" },
        { value: "Asia/Dubai", label: "Asia/Dubai" },
        { value: "Asia/Dushanbe", label: "Asia/Dushanbe" },
        { value: "Asia/Famagusta", label: "Asia/Famagusta" },
        { value: "Asia/Gaza", label: "Asia/Gaza" },
        { value: "Asia/Harbin", label: "Asia/Harbin" },
        { value: "Asia/Hebron", label: "Asia/Hebron" },
        { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh" },
        { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong" },
        { value: "Asia/Hovd", label: "Asia/Hovd" },
        { value: "Asia/Irkutsk", label: "Asia/Irkutsk" },
        { value: "Asia/Istanbul", label: "Asia/Istanbul" },
        { value: "Asia/Jakarta", label: "Asia/Jakarta" },
        { value: "Asia/Jayapura", label: "Asia/Jayapura" },
        { value: "Asia/Jerusalem", label: "Asia/Jerusalem" },
        { value: "Asia/Kabul", label: "Asia/Kabul" },
        { value: "Asia/Kamchatka", label: "Asia/Kamchatka" },
        { value: "Asia/Karachi", label: "Asia/Karachi" },
        { value: "Asia/Kashgar", label: "Asia/Kashgar" },
        { value: "Asia/Kathmandu", label: "Asia/Kathmandu" },
        { value: "Asia/Katmandu", label: "Asia/Katmandu" },
        { value: "Asia/Khandyga", label: "Asia/Khandyga" },
        { value: "Asia/Kolkata", label: "Asia/Kolkata" },
        { value: "Asia/Krasnoyarsk", label: "Asia/Krasnoyarsk" },
        { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur" },
        { value: "Asia/Kuching", label: "Asia/Kuching" },
        { value: "Asia/Kuwait", label: "Asia/Kuwait" },
        { value: "Asia/Macao", label: "Asia/Macao" },
        { value: "Asia/Macau", label: "Asia/Macau" },
        { value: "Asia/Magadan", label: "Asia/Magadan" },
        { value: "Asia/Makassar", label: "Asia/Makassar" },
        { value: "Asia/Manila", label: "Asia/Manila" },
        { value: "Asia/Muscat", label: "Asia/Muscat" },
        { value: "Asia/Nicosia", label: "Asia/Nicosia" },
        { value: "Asia/Novokuznetsk", label: "Asia/Novokuznetsk" },
        { value: "Asia/Novosibirsk", label: "Asia/Novosibirsk" },
        { value: "Asia/Omsk", label: "Asia/Omsk" },
        { value: "Asia/Oral", label: "Asia/Oral" },
        { value: "Asia/Phnom_Penh", label: "Asia/Phnom_Penh" },
        { value: "Asia/Pontianak", label: "Asia/Pontianak" },
        { value: "Asia/Pyongyang", label: "Asia/Pyongyang" },
        { value: "Asia/Qatar", label: "Asia/Qatar" },
        { value: "Asia/Qostanay", label: "Asia/Qostanay" },
        { value: "Asia/Qyzylorda", label: "Asia/Qyzylorda" },
        { value: "Asia/Rangoon", label: "Asia/Rangoon" },
        { value: "Asia/Riyadh", label: "Asia/Riyadh" },
        { value: "Asia/Saigon", label: "Asia/Saigon" },
        { value: "Asia/Sakhalin", label: "Asia/Sakhalin" },
        { value: "Asia/Samarkand", label: "Asia/Samarkand" },
        { value: "Asia/Seoul", label: "Asia/Seoul" },
        { value: "Asia/Shanghai", label: "Asia/Shanghai" },
        { value: "Asia/Singapore", label: "Asia/Singapore" },
        { value: "Asia/Srednekolymsk", label: "Asia/Srednekolymsk" },
        { value: "Asia/Taipei", label: "Asia/Taipei" },
        { value: "Asia/Tashkent", label: "Asia/Tashkent" },
        { value: "Asia/Tbilisi", label: "Asia/Tbilisi" },
        { value: "Asia/Tehran", label: "Asia/Tehran" },
        { value: "Asia/Tel_Aviv", label: "Asia/Tel_Aviv" },
        { value: "Asia/Thimbu", label: "Asia/Thimbu" },
        { value: "Asia/Thimphu", label: "Asia/Thimphu" },
        { value: "Asia/Tokyo", label: "Asia/Tokyo" },
        { value: "Asia/Tomsk", label: "Asia/Tomsk" },
        { value: "Asia/Ujung_Pandang", label: "Asia/Ujung_Pandang" },
        { value: "Asia/Ulaanbaatar", label: "Asia/Ulaanbaatar" },
        { value: "Asia/Ulan_Bator", label: "Asia/Ulan_Bator" },
        { value: "Asia/Urumqi", label: "Asia/Urumqi" },
        { value: "Asia/Ust-Nera", label: "Asia/Ust-Nera" },
        { value: "Asia/Vientiane", label: "Asia/Vientiane" },
        { value: "Asia/Vladivostok", label: "Asia/Vladivostok" },
        { value: "Asia/Yakutsk", label: "Asia/Yakutsk" },
        { value: "Asia/Yangon", label: "Asia/Yangon" },
        { value: "Asia/Yekaterinburg", label: "Asia/Yekaterinburg" },
        { value: "Asia/Yerevan", label: "Asia/Yerevan" },
        { value: "Atlantic/Azores", label: "Atlantic/Azores" },
        { value: "Atlantic/Bermuda", label: "Atlantic/Bermuda" },
        { value: "Atlantic/Canary", label: "Atlantic/Canary" },
        { value: "Atlantic/Cape_Verde", label: "Atlantic/Cape_Verde" },
        { value: "Atlantic/Faeroe", label: "Atlantic/Faeroe" },
        { value: "Atlantic/Faroe", label: "Atlantic/Faroe" },
        { value: "Atlantic/Jan_Mayen", label: "Atlantic/Jan_Mayen" },
        { value: "Atlantic/Madeira", label: "Atlantic/Madeira" },
        { value: "Atlantic/Reykjavik", label: "Atlantic/Reykjavik" },
        { value: "Atlantic/South_Georgia", label: "Atlantic/South_Georgia" },
        { value: "Atlantic/St_Helena", label: "Atlantic/St_Helena" },
        { value: "Atlantic/Stanley", label: "Atlantic/Stanley" },
        { value: "Australia/ACT", label: "Australia/ACT" },
        { value: "Australia/Adelaide", label: "Australia/Adelaide" },
        { value: "Australia/Brisbane", label: "Australia/Brisbane" },
        { value: "Australia/Broken_Hill", label: "Australia/Broken_Hill" },
        { value: "Australia/Canberra", label: "Australia/Canberra" },
        { value: "Australia/Currie", label: "Australia/Currie" },
        { value: "Australia/Darwin", label: "Australia/Darwin" },
        { value: "Australia/Eucla", label: "Australia/Eucla" },
        { value: "Australia/Hobart", label: "Australia/Hobart" },
        { value: "Australia/LHI", label: "Australia/LHI" },
        { value: "Australia/Lindeman", label: "Australia/Lindeman" },
        { value: "Australia/Lord_Howe", label: "Australia/Lord_Howe" },
        { value: "Australia/Melbourne", label: "Australia/Melbourne" },
        { value: "Australia/NSW", label: "Australia/NSW" },
        { value: "Australia/North", label: "Australia/North" },
        { value: "Australia/Perth", label: "Australia/Perth" },
        { value: "Australia/Queensland", label: "Australia/Queensland" },
        { value: "Australia/South", label: "Australia/South" },
        { value: "Australia/Sydney", label: "Australia/Sydney" },
        { value: "Australia/Tasmania", label: "Australia/Tasmania" },
        { value: "Australia/Victoria", label: "Australia/Victoria" },
        { value: "Australia/West", label: "Australia/West" },
        { value: "Australia/Yancowinna", label: "Australia/Yancowinna" },
        { value: "Brazil/Acre", label: "Brazil/Acre" },
        { value: "Brazil/DeNoronha", label: "Brazil/DeNoronha" },
        { value: "Brazil/East", label: "Brazil/East" },
        { value: "Brazil/West", label: "Brazil/West" },
        { value: "CET", label: "CET" },
        { value: "CST6CDT", label: "CST6CDT" },
        { value: "Canada/Atlantic", label: "Canada/Atlantic" },
        { value: "Canada/Central", label: "Canada/Central" },
        { value: "Canada/Eastern", label: "Canada/Eastern" },
        { value: "Canada/Mountain", label: "Canada/Mountain" },
        { value: "Canada/Newfoundland", label: "Canada/Newfoundland" },
        { value: "Canada/Pacific", label: "Canada/Pacific" },
        { value: "Canada/Saskatchewan", label: "Canada/Saskatchewan" },
        { value: "Canada/Yukon", label: "Canada/Yukon" },
        { value: "Chile/Continental", label: "Chile/Continental" },
        { value: "Chile/EasterIsland", label: "Chile/EasterIsland" },
        { value: "Cuba", label: "Cuba" },
        { value: "EET", label: "EET" },
        { value: "EST", label: "EST" },
        { value: "EST5EDT", label: "EST5EDT" },
        { value: "Egypt", label: "Egypt" },
        { value: "Eire", label: "Eire" },
        { value: "Etc/GMT", label: "Etc/GMT" },
        { value: "Etc/GMT+0", label: "Etc/GMT+0" },
        { value: "Etc/GMT+1", label: "Etc/GMT+1" },
        { value: "Etc/GMT+10", label: "Etc/GMT+10" },
        { value: "Etc/GMT+11", label: "Etc/GMT+11" },
        { value: "Etc/GMT+12", label: "Etc/GMT+12" },
        { value: "Etc/GMT+2", label: "Etc/GMT+2" },
        { value: "Etc/GMT+3", label: "Etc/GMT+3" },
        { value: "Etc/GMT+4", label: "Etc/GMT+4" },
        { value: "Etc/GMT+5", label: "Etc/GMT+5" },
        { value: "Etc/GMT+6", label: "Etc/GMT+6" },
        { value: "Etc/GMT+7", label: "Etc/GMT+7" },
        { value: "Etc/GMT+8", label: "Etc/GMT+8" },
        { value: "Etc/GMT+9", label: "Etc/GMT+9" },
        { value: "Etc/GMT-0", label: "Etc/GMT-0" },
        { value: "Etc/GMT-1", label: "Etc/GMT-1" },
        { value: "Etc/GMT-10", label: "Etc/GMT-10" },
        { value: "Etc/GMT-11", label: "Etc/GMT-11" },
        { value: "Etc/GMT-12", label: "Etc/GMT-12" },
        { value: "Etc/GMT-13", label: "Etc/GMT-13" },
        { value: "Etc/GMT-14", label: "Etc/GMT-14" },
        { value: "Etc/GMT-2", label: "Etc/GMT-2" },
        { value: "Etc/GMT-3", label: "Etc/GMT-3" },
        { value: "Etc/GMT-4", label: "Etc/GMT-4" },
        { value: "Etc/GMT-5", label: "Etc/GMT-5" },
        { value: "Etc/GMT-6", label: "Etc/GMT-6" },
        { value: "Etc/GMT-7", label: "Etc/GMT-7" },
        { value: "Etc/GMT-8", label: "Etc/GMT-8" },
        { value: "Etc/GMT-9", label: "Etc/GMT-9" },
        { value: "Etc/GMT0", label: "Etc/GMT0" },
        { value: "Etc/Greenwich", label: "Etc/Greenwich" },
        { value: "Etc/UCT", label: "Etc/UCT" },
        { value: "Etc/UTC", label: "Etc/UTC" },
        { value: "Etc/Universal", label: "Etc/Universal" },
        { value: "Etc/Zulu", label: "Etc/Zulu" },
        { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
        { value: "Europe/Andorra", label: "Europe/Andorra" },
        { value: "Europe/Astrakhan", label: "Europe/Astrakhan" },
        { value: "Europe/Athens", label: "Europe/Athens" },
        { value: "Europe/Belfast", label: "Europe/Belfast" },
        { value: "Europe/Belgrade", label: "Europe/Belgrade" },
        { value: "Europe/Berlin", label: "Europe/Berlin" },
        { value: "Europe/Bratislava", label: "Europe/Bratislava" },
        { value: "Europe/Brussels", label: "Europe/Brussels" },
        { value: "Europe/Bucharest", label: "Europe/Bucharest" },
        { value: "Europe/Budapest", label: "Europe/Budapest" },
        { value: "Europe/Busingen", label: "Europe/Busingen" },
        { value: "Europe/Chisinau", label: "Europe/Chisinau" },
        { value: "Europe/Copenhagen", label: "Europe/Copenhagen" },
        { value: "Europe/Dublin", label: "Europe/Dublin" },
        { value: "Europe/Gibraltar", label: "Europe/Gibraltar" },
        { value: "Europe/Guernsey", label: "Europe/Guernsey" },
        { value: "Europe/Helsinki", label: "Europe/Helsinki" },
        { value: "Europe/Isle_of_Man", label: "Europe/Isle_of_Man" },
        { value: "Europe/Istanbul", label: "Europe/Istanbul" },
        { value: "Europe/Jersey", label: "Europe/Jersey" },
        { value: "Europe/Kaliningrad", label: "Europe/Kaliningrad" },
        { value: "Europe/Kiev", label: "Europe/Kiev" },
        { value: "Europe/Kirov", label: "Europe/Kirov" },
        { value: "Europe/Lisbon", label: "Europe/Lisbon" },
        { value: "Europe/Ljubljana", label: "Europe/Ljubljana" },
        { value: "Europe/London", label: "Europe/London" },
        { value: "Europe/Luxembourg", label: "Europe/Luxembourg" },
        { value: "Europe/Madrid", label: "Europe/Madrid" },
        { value: "Europe/Malta", label: "Europe/Malta" },
        { value: "Europe/Mariehamn", label: "Europe/Mariehamn" },
        { value: "Europe/Minsk", label: "Europe/Minsk" },
        { value: "Europe/Monaco", label: "Europe/Monaco" },
        { value: "Europe/Moscow", label: "Europe/Moscow" },
        { value: "Europe/Nicosia", label: "Europe/Nicosia" },
        { value: "Europe/Oslo", label: "Europe/Oslo" },
        { value: "Europe/Paris", label: "Europe/Paris" },
        { value: "Europe/Podgorica", label: "Europe/Podgorica" },
        { value: "Europe/Prague", label: "Europe/Prague" },
        { value: "Europe/Riga", label: "Europe/Riga" },
        { value: "Europe/Rome", label: "Europe/Rome" },
        { value: "Europe/Samara", label: "Europe/Samara" },
        { value: "Europe/San_Marino", label: "Europe/San_Marino" },
        { value: "Europe/Sarajevo", label: "Europe/Sarajevo" },
        { value: "Europe/Saratov", label: "Europe/Saratov" },
        { value: "Europe/Simferopol", label: "Europe/Simferopol" },
        { value: "Europe/Skopje", label: "Europe/Skopje" },
        { value: "Europe/Sofia", label: "Europe/Sofia" },
        { value: "Europe/Stockholm", label: "Europe/Stockholm" },
        { value: "Europe/Tallinn", label: "Europe/Tallinn" },
        { value: "Europe/Tirane", label: "Europe/Tirane" },
        { value: "Europe/Tiraspol", label: "Europe/Tiraspol" },
        { value: "Europe/Ulyanovsk", label: "Europe/Ulyanovsk" },
        { value: "Europe/Uzhgorod", label: "Europe/Uzhgorod" },
        { value: "Europe/Vaduz", label: "Europe/Vaduz" },
        { value: "Europe/Vatican", label: "Europe/Vatican" },
        { value: "Europe/Vienna", label: "Europe/Vienna" },
        { value: "Europe/Vilnius", label: "Europe/Vilnius" },
        { value: "Europe/Volgograd", label: "Europe/Volgograd" },
        { value: "Europe/Warsaw", label: "Europe/Warsaw" },
        { value: "Europe/Zagreb", label: "Europe/Zagreb" },
        { value: "Europe/Zaporozhye", label: "Europe/Zaporozhye" },
        { value: "Europe/Zurich", label: "Europe/Zurich" },
        { value: "GB", label: "GB" },
        { value: "GB-Eire", label: "GB-Eire" },
        { value: "GMT", label: "GMT" },
        { value: "GMT+0", label: "GMT+0" },
        { value: "GMT-0", label: "GMT-0" },
        { value: "GMT0", label: "GMT0" },
        { value: "Greenwich", label: "Greenwich" },
        { value: "HST", label: "HST" },
        { value: "Hongkong", label: "Hongkong" },
        { value: "Iceland", label: "Iceland" },
        { value: "Indian/Antananarivo", label: "Indian/Antananarivo" },
        { value: "Indian/Chagos", label: "Indian/Chagos" },
        { value: "Indian/Christmas", label: "Indian/Christmas" },
        { value: "Indian/Cocos", label: "Indian/Cocos" },
        { value: "Indian/Comoro", label: "Indian/Comoro" },
        { value: "Indian/Kerguelen", label: "Indian/Kerguelen" },
        { value: "Indian/Mahe", label: "Indian/Mahe" },
        { value: "Indian/Maldives", label: "Indian/Maldives" },
        { value: "Indian/Mauritius", label: "Indian/Mauritius" },
        { value: "Indian/Mayotte", label: "Indian/Mayotte" },
        { value: "Indian/Reunion", label: "Indian/Reunion" },
        { value: "Iran", label: "Iran" },
        { value: "Israel", label: "Israel" },
        { value: "Jamaica", label: "Jamaica" },
        { value: "Japan", label: "Japan" },
        { value: "Kwajalein", label: "Kwajalein" },
        { value: "Libya", label: "Libya" },
        { value: "MET", label: "MET" },
        { value: "MST", label: "MST" },
        { value: "MST7MDT", label: "MST7MDT" },
        { value: "Mexico/BajaNorte", label: "Mexico/BajaNorte" },
        { value: "Mexico/BajaSur", label: "Mexico/BajaSur" },
        { value: "Mexico/General", label: "Mexico/General" },
        { value: "NZ", label: "NZ" },
        { value: "NZ-CHAT", label: "NZ-CHAT" },
        { value: "Navajo", label: "Navajo" },
        { value: "PRC", label: "PRC" },
        { value: "PST8PDT", label: "PST8PDT" },
        { value: "Pacific/Apia", label: "Pacific/Apia" },
        { value: "Pacific/Auckland", label: "Pacific/Auckland" },
        { value: "Pacific/Bougainville", label: "Pacific/Bougainville" },
        { value: "Pacific/Chatham", label: "Pacific/Chatham" },
        { value: "Pacific/Chuuk", label: "Pacific/Chuuk" },
        { value: "Pacific/Easter", label: "Pacific/Easter" },
        { value: "Pacific/Efate", label: "Pacific/Efate" },
        { value: "Pacific/Enderbury", label: "Pacific/Enderbury" },
        { value: "Pacific/Fakaofo", label: "Pacific/Fakaofo" },
        { value: "Pacific/Fiji", label: "Pacific/Fiji" },
        { value: "Pacific/Funafuti", label: "Pacific/Funafuti" },
        { value: "Pacific/Galapagos", label: "Pacific/Galapagos" },
        { value: "Pacific/Gambier", label: "Pacific/Gambier" },
        { value: "Pacific/Guadalcanal", label: "Pacific/Guadalcanal" },
        { value: "Pacific/Guam", label: "Pacific/Guam" },
        { value: "Pacific/Honolulu", label: "Pacific/Honolulu" },
        { value: "Pacific/Johnston", label: "Pacific/Johnston" },
        { value: "Pacific/Kiritimati", label: "Pacific/Kiritimati" },
        { value: "Pacific/Kosrae", label: "Pacific/Kosrae" },
        { value: "Pacific/Kwajalein", label: "Pacific/Kwajalein" },
        { value: "Pacific/Majuro", label: "Pacific/Majuro" },
        { value: "Pacific/Marquesas", label: "Pacific/Marquesas" },
        { value: "Pacific/Midway", label: "Pacific/Midway" },
        { value: "Pacific/Nauru", label: "Pacific/Nauru" },
        { value: "Pacific/Niue", label: "Pacific/Niue" },
        { value: "Pacific/Norfolk", label: "Pacific/Norfolk" },
        { value: "Pacific/Noumea", label: "Pacific/Noumea" },
        { value: "Pacific/Pago_Pago", label: "Pacific/Pago_Pago" },
        { value: "Pacific/Palau", label: "Pacific/Palau" },
        { value: "Pacific/Pitcairn", label: "Pacific/Pitcairn" },
        { value: "Pacific/Pohnpei", label: "Pacific/Pohnpei" },
        { value: "Pacific/Ponape", label: "Pacific/Ponape" },
        { value: "Pacific/Port_Moresby", label: "Pacific/Port_Moresby" },
        { value: "Pacific/Rarotonga", label: "Pacific/Rarotonga" },
        { value: "Pacific/Saipan", label: "Pacific/Saipan" },
        { value: "Pacific/Samoa", label: "Pacific/Samoa" },
        { value: "Pacific/Tahiti", label: "Pacific/Tahiti" },
        { value: "Pacific/Tarawa", label: "Pacific/Tarawa" },
        { value: "Pacific/Tongatapu", label: "Pacific/Tongatapu" },
        { value: "Pacific/Truk", label: "Pacific/Truk" },
        { value: "Pacific/Wake", label: "Pacific/Wake" },
        { value: "Pacific/Wallis", label: "Pacific/Wallis" },
        { value: "Pacific/Yap", label: "Pacific/Yap" },
        { value: "Poland", label: "Poland" },
        { value: "Portugal", label: "Portugal" },
        { value: "ROC", label: "ROC" },
        { value: "ROK", label: "ROK" },
        { value: "Singapore", label: "Singapore" },
        { value: "Turkey", label: "Turkey" },
        { value: "UCT", label: "UCT" },
        { value: "US/Alaska", label: "US/Alaska" },
        { value: "US/Aleutian", label: "US/Aleutian" },
        { value: "US/Arizona", label: "US/Arizona" },
        { value: "US/Central", label: "US/Central" },
        { value: "US/East-Indiana", label: "US/East-Indiana" },
        { value: "US/Eastern", label: "US/Eastern" },
        { value: "US/Hawaii", label: "US/Hawaii" },
        { value: "US/Indiana-Starke", label: "US/Indiana-Starke" },
        { value: "US/Michigan", label: "US/Michigan" },
        { value: "US/Mountain", label: "US/Mountain" },
        { value: "US/Pacific", label: "US/Pacific" },
        { value: "US/Pacific-New", label: "US/Pacific-New" },
        { value: "US/Samoa", label: "US/Samoa" },
        { value: "UTC", label: "UTC" },
        { value: "Universal", label: "Universal" },
        { value: "W-SU", label: "W-SU" },
        { value: "WET", label: "WET" },
        { value: "Zulu", label: "Zulu" }
    ];
    
    // Remove duplicates from timezone options
    const timezoneOptions = allTimezones.filter((timezone, index, arr) => 
        arr.findIndex(t => t.value === timezone.value) === index
    );

    // Visibility options
    const visibilityOptions = [
        { value: "private", label: "private" },
        { value: "public", label: "public" }
    ];

    // Yes/No options
    const yesNoOptions = [
        { value: "no", label: "no" },
        { value: "yes", label: "yes" }
    ];

    // Alert functions
    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function resetForm() {
        config = {
            topologyName: "",
            scenarioId: "",
            poolId: "",
            
            usernameConfig: "admin",
            passwordConfig: "admin",
            adminUsername: "supervisor",
            adminPassword: "admin",
            
            ctfName: "",
            ctfDescription: "",
            challengeVisibility: "private" as const,
            accountVisibility: "private" as const,
            scoreVisibility: "private" as const,
            registrationVisibility: "private" as const,
            allowNameChanges: "no" as const,
            allowTeamCreation: "no" as const,
            allowTeamDisbanding: "no" as const,
            
            confStartTime: "",
            confStopTime: "",
            timeZone: "Europe/Vienna",
            allowViewingAfter: "yes" as const
        };
    }

    async function handleSubmit() {
        if (!config.topologyName.trim() || !config.scenarioId.trim() || !config.poolId.trim()) {
            showAlert('Please fill in all required fields (Topology Name, Scenario ID, Pool ID)', 'error');
            return;
        }

        try {
            isSubmitting = true;
            showAlert('Creating CTFd topology...', 'success');
            
            const result = await createCtfdTopology(config);
            showAlert(`CTFd topology "${result.topologyName}" created successfully with ID: ${result.topologyId}`, 'success');
            
            // Reset form on success
            resetForm();
        } catch (error: any) {
            console.error('Error creating CTFd topology:', error);
            
            let errorMessage = 'CTFd topology creation was not successful. Please check your inputs and try again.';
            
            // Extract detailed error message if available
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            } else if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
                errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = `Creation failed: ${error.message}`;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Create CTFd</h1>
            <p class="text-sm text-muted-foreground">
                Create a topology with automated CTFd deployment tailored to your new shared CTFd pool
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline" onclick={resetForm} class="flex items-center gap-2" disabled={isSubmitting}>
                <RotateCcw class="h-4 w-4" />
                Reset Form
            </Button>
            <Button onclick={handleSubmit} class="flex items-center gap-2" disabled={isSubmitting}>
                <Send class="h-4 w-4" />
                {isSubmitting ? 'Creating...' : 'Create CTFd Topology'}
            </Button>
        </div>
    </div>

    <!-- Floating Alert Messages -->
    {#if alertMessage}
        <div class="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl animate-in slide-in-from-top-2">
            <Alert.Root variant={alertMessage.type === 'error' ? 'destructive' : 'default'} class="shadow-lg border">
                {#if alertMessage.type === 'error'}
                    <AlertCircle class="h-4 w-4" />
                {:else}
                    <CheckCircle2 class="h-4 w-4" />
                {/if}
                <Alert.Title class="text-sm font-medium">
                    {alertMessage.type === 'error' ? 'Error' : 'Success'}
                </Alert.Title>
                <Alert.Description class="text-sm flex items-start justify-between pr-2">
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm max-w-full">{alertMessage.message}</pre>
                    <Button variant="ghost" size="sm" onclick={hideAlert} class="h-6 w-6 p-0 ml-2 flex-shrink-0">
                        <X class="h-3 w-3" />
                    </Button>
                </Alert.Description>
            </Alert.Root>
        </div>
    {/if}

    <!-- Single compact grid layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Column 1: Scenario & Time Settings -->
        <div class="space-y-4">
            <!-- Scenario Configuration -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Scenario Configuration</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="topologyName" class="text-sm">Topology Name *</Label>
                        <Input 
                            id="topologyName" 
                            bind:value={config.topologyName}
                            placeholder="Topology name *"
                        />
                    </div>
                    <div>
                        <Label for="scenarioId" class="text-sm">Scenario ID *</Label>
                        <Popover.Root bind:open={scenarioOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={scenarioOpen}
                                        class="w-full justify-between"
                                    >
                                        {scenarioOptions.find((s) => s.value === config.scenarioId)?.label ?? "Select scenario..."}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-[400px] p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search scenarios..." />
                                    <Command.Empty>No scenario found.</Command.Empty>
                                    <Command.Group>
                                        {#each scenarioOptions as scenario}
                                            <Command.Item
                                                value={scenario.label}
                                                onSelect={() => {
                                                    config.scenarioId = scenario.value;
                                                    scenarioOpen = false;
                                                }}
                                            >
                                                <Check class="mr-2 h-4 w-4 {config.scenarioId === scenario.value ? 'opacity-100' : 'opacity-0'}" />
                                                <div class="flex flex-col">
                                                    <span>{scenario.label}</span>
                                                    {#if scenario.description}
                                                        <span class="text-xs text-muted-foreground">ID: {scenario.description}</span>
                                                    {/if}
                                                </div>
                                            </Command.Item>
                                        {/each}
                                    </Command.Group>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="poolId" class="text-sm">Pool ID *</Label>
                        <Popover.Root bind:open={poolOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={poolOpen}
                                        class="w-full justify-between"
                                    >
                                        {poolOptions.find((p) => p.value === config.poolId)?.label ?? "Select pool..."}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-[400px] p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search pools..." />
                                    <Command.Empty>No pool found.</Command.Empty>
                                    <Command.Group>
                                        {#each poolOptions as pool}
                                            <Command.Item
                                                value={pool.label}
                                                onSelect={() => {
                                                    config.poolId = pool.value;
                                                    poolOpen = false;
                                                }}
                                            >
                                                <Check class="mr-2 h-4 w-4 {config.poolId === pool.value ? 'opacity-100' : 'opacity-0'}" />
                                                <div class="flex flex-col">
                                                    <span>{pool.label}</span>
                                                    {#if pool.poolId}
                                                        <span class="text-xs text-muted-foreground">ID: {pool.poolId}</span>
                                                    {/if}
                                                </div>
                                            </Command.Item>
                                        {/each}
                                    </Command.Group>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- Time Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Time Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="confStartTime" class="text-sm">Start Time</Label>
                        <Input 
                            id="confStartTime" 
                            bind:value={config.confStartTime}
                            placeholder="DD/MM/YYYY HH:MM (optional)"
                            class="h-10"
                        />
                        <p class="text-xs text-muted-foreground mt-1">Format: DD/MM/YYYY HH:MM (e.g., 20/07/2025 15:30)</p>
                    </div>
                    <div>
                        <Label for="confStopTime" class="text-sm">Stop Time</Label>
                        <Input 
                            id="confStopTime" 
                            bind:value={config.confStopTime}
                            placeholder="DD/MM/YYYY HH:MM (optional)"
                            class="h-10"
                        />
                        <p class="text-xs text-muted-foreground mt-1">Format: DD/MM/YYYY HH:MM (e.g., 21/07/2025 15:30)</p>
                    </div>
                    <div>
                        <Label for="timeZone" class="text-sm">Timezone</Label>
                        <Popover.Root bind:open={timezoneOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={timezoneOpen}
                                    >
                                        {timezoneOptions.find(t => t.value === config.timeZone)?.label || "Select timezone"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search timezones..." />
                                    <Command.List>
                                        <Command.Empty>No timezone found.</Command.Empty>
                                        <Command.Group>
                                            {#each timezoneOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.timeZone = option.value;
                                                        timezoneOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.timeZone !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowViewingAfter" class="text-sm">Allow Viewing After End</Label>
                        <Popover.Root bind:open={allowViewingAfterOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowViewingAfterOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowViewingAfter)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowViewingAfter = option.value as typeof config.allowViewingAfter;
                                                        allowViewingAfterOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowViewingAfter !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Column 2: CTFd Settings -->
        <div class="space-y-4">
            <!-- CTFd Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">CTFd Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="adminUsername" class="text-sm">Admin Username</Label>
                        <Input 
                            id="adminUsername" 
                            bind:value={config.adminUsername}
                            placeholder="New admin username"
                        />
                    </div>
                    <div>
                        <Label for="adminPassword" class="text-sm">Admin Password</Label>
                        <Input 
                            id="adminPassword" 
                            type="text"
                            bind:value={config.adminPassword}
                            placeholder="New admin password"
                        />
                    </div>
                    <div>
                        <Label for="ctfName" class="text-sm">CTF Name</Label>
                        <Input 
                            id="ctfName" 
                            bind:value={config.ctfName}
                            placeholder="CTF name (optional)"
                        />
                    </div>
                    <div>
                        <Label for="ctfDescription" class="text-sm">CTF Description</Label>
                        <Input 
                            id="ctfDescription" 
                            bind:value={config.ctfDescription}
                            placeholder="CTF description (optional)"
                        />
                    </div>
                    <div>
                        <Label for="usernameConfig" class="text-sm">Username (used during configuration)</Label>
                        <Input 
                            id="usernameConfig" 
                            bind:value={config.usernameConfig}
                            placeholder="Scenario username"
                        />
                    </div>
                    <div>
                        <Label for="passwordConfig" class="text-sm">Password (used during configuration)</Label>
                        <Input 
                            id="passwordConfig" 
                            type="text"
                            bind:value={config.passwordConfig}
                            placeholder="Scenario password"
                        />
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Column 3: Visibility & User/Team Settings -->
        <div class="space-y-4">
            <!-- Visibility Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Visibility Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="challengeVisibility" class="text-sm">Challenge Visibility</Label>
                        <Popover.Root bind:open={challengeVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={challengeVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.challengeVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.challengeVisibility = option.value as typeof config.challengeVisibility;
                                                        challengeVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.challengeVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="accountVisibility" class="text-sm">Account Visibility</Label>
                        <Popover.Root bind:open={accountVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={accountVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.accountVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.accountVisibility = option.value as typeof config.accountVisibility;
                                                        accountVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.accountVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="scoreVisibility" class="text-sm">Score Visibility</Label>
                        <Popover.Root bind:open={scoreVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={scoreVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.scoreVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.scoreVisibility = option.value as typeof config.scoreVisibility;
                                                        scoreVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.scoreVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="registrationVisibility" class="text-sm">Registration Visibility</Label>
                        <Popover.Root bind:open={registrationVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={registrationVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.registrationVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.registrationVisibility = option.value as typeof config.registrationVisibility;
                                                        registrationVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.registrationVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- User/Team Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">User & Team Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="allowNameChanges" class="text-sm">Allow Name Changes</Label>
                        <Popover.Root bind:open={allowNameChangesOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowNameChangesOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowNameChanges)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowNameChanges = option.value as typeof config.allowNameChanges;
                                                        allowNameChangesOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowNameChanges !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowTeamCreation" class="text-sm">Allow Team Creation</Label>
                        <Popover.Root bind:open={allowTeamCreationOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowTeamCreationOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowTeamCreation)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowTeamCreation = option.value as typeof config.allowTeamCreation;
                                                        allowTeamCreationOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowTeamCreation !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowTeamDisbanding" class="text-sm">Allow Team Disbanding</Label>
                        <Popover.Root bind:open={allowTeamDisbandingOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowTeamDisbandingOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowTeamDisbanding)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowTeamDisbanding = option.value as typeof config.allowTeamDisbanding;
                                                        allowTeamDisbandingOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowTeamDisbanding !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>
    </div>
</div>