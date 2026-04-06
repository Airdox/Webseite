import { File } from 'megajs';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    const filePath = url.pathname.replace(/^\/audio\//, '');
    const decodedPath = decodeURIComponent(filePath);

    const megaLinks = {
      "public/01 REC-2026-03-06.mp3": "https://mega.nz/file/IIs2SRSY#s6CIqIxexVGOWO2_K2BMfL0bmU8R83RMIFbmw-s1n_4",
      "public/01 REC-2026-03-07.mp3": "https://mega.nz/file/1R8VDILR#ThEiP1XqWsm8lYFhwiPws4KcFQTQr3m7vMMPTCdV1Sg",
      "public/01 REC-2026-03-08.mp3": "https://mega.nz/file/sFVDFTCa#-xGFYd33q_mof6cuZntfrIB_Sf6ZlLz6jfgBtPTnCac",
      "public/65_full.mp3": "https://mega.nz/file/gc8BDZDK#u1Hj_rG6sLoeB0KeWEBhjS0qDYHcH2Knm8cc8G-QZNU",
      "public/Airdox Pirate Studio_17.12.2025.mp3": "https://mega.nz/file/MQ8gBYxQ#Vrwv2MHy-XZjZ3H7zGF9pSF1rC-E0D6fQJpzgNwDyZw",
      "public/Airdox Pirate Studio_17.12.2025.txt": "https://mega.nz/file/UQVwhYDK#MHHoqIoFawyWTjGUEkOgPniGTOsJCJy-fBIGVCmsax8",
      "public/Airdox Pirate-Studio 3_12_2025.mp3": "https://mega.nz/file/9Nsi1RbI#Whgyi2aekdy2jtML6TaEJBgQ-vi-lLH36_69rX8q64Y",
      "public/Airdox vs Jette_sollte nicht sein_2024_02_full.mp3": "https://mega.nz/file/EN1lDaSZ#u-cvRr2UKZgwRMlzrEEO7DeZJWy5p1STDhVQFUIWeGU",
      "public/Airdox_REC_2026_03_09.mp3": "https://mega.nz/file/pUtXQACI#U3fuldgztQgwihGzVggMit_Ir0UQUZiBjdyACL1B7yI",
      "public/Airdox_REC_2026_03_15.mp3": "https://mega.nz/file/oN9kWbiK#8fhXvc7_PiOEwadK9xg4Wxcs-FaTR1B9XffjPU4gDJw",
      "public/Airdox_Secret_Set_Pirate_Studio_22_12_2025_full.mp3": "https://mega.nz/file/QUcDBLrB#5BhL9gooZ-H1alCp_iITN2gQQzIDQIlZ0HHZOXj8pCs",
      "public/Airdox_tschau_märkische_full.mp3": "https://mega.nz/file/AAsgFAzI#gkx28-EzKw4ypAqBDH7dff7ZMop0BsRbrgM2a-5XC6Q",
      "public/LIESMICH.txt": "https://mega.nz/file/AFMC1AhI#sMiSCmnkC-99JWYEHeLcPD6cltPK0_C8v2WINxRCI_o",
      "public/Over and OUt_full.mp3": "https://mega.nz/file/oNcwxIyI#lmBfkQu9aOKO-PCxCD-2uEqmfILTS6OJ9y6JxF_Civc",
      "public/TEMP_01 REC-2026-03-06.mp3": "https://mega.nz/file/ENs3gDza#nulquRUOnYXdCzINSTHpEPO0cnUJNhUFkTfvEsqYcsI",
      "public/ohboy_full.mp3": "https://mega.nz/file/gRUSRT7K#xQWdRTrNsMeDJDVy2GBW1tGZywzgvqo5nwEHipIY9xw",
      "vip/LIESMICH.txt": "https://mega.nz/file/8F0UVbCL#OWvS3fqNu5ZB2yhvVBSpmEH9_aqRjNs-serawDNsg_0"
    };

    const megaUrl = megaLinks[decodedPath];

    if (megaUrl) {
        try {
            // Mega.nz direct streaming is complex in Workers due to memory limits.
            // The most reliable free way is to use a public Mega-to-Direct-Link proxy 
            // or redirect to a known direct link format if available.
            // Since we want 100% free and autonomous, we'll use the redirect to the 
            // Mega.nz file viewer as a fallback, but for audio we need a direct stream.
            
            // For now, let's try the redirect again but with a specific header 
            // that might help some browsers, or use a known direct link pattern.
            return Response.redirect(megaUrl, 302);
        } catch (e) {
            return new Response('Error streaming from Mega: ' + e.message, { status: 500 });
        }
    }

    return new Response('File not found: ' + decodedPath, { status: 404 });
}
