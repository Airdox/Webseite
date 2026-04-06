export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Extract the file path from the URL
    // Example: /audio/public/01%20REC-2026-03-06.mp3
    const filePath = url.pathname.replace(/^\/audio\//, '');
    const decodedPath = decodeURIComponent(filePath);

    // Load the links from a KV namespace or a static file
    // For simplicity during migration, we'll use a hardcoded map or 
    // better: redirect to the Mega.nz link if we have it.
    
    // In a real production setup, you'd store these in Cloudflare KV.
    // For this autonomous migration, I'll embed the map generated earlier.
    const megaLinks = {
      "public/01 REC-2026-03-06.mp3": "https://mega.nz/file/ABsyxJpJ#oc7_mPIVB5awbKfqOc4UoYhyzPu3V7rw_J6PdalBybg",
      "public/01 REC-2026-03-07.mp3": "https://mega.nz/file/JcsmXTwI#bWZxdZitMuruUp1WF1XlxDWq72KCspvBiLppvqg3k7A",
      "public/01 REC-2026-03-08.mp3": "https://mega.nz/file/wds1nDgJ#dp66CbPOnjCivQ7HAZLK4C0eNf26_2BrASrjZepH8-s",
      "public/65_full.mp3": "https://mega.nz/file/MQszxCoZ#Z-I6_7LCTJ1FSXzIWYsA5DejVLCXi2NcvC2bgTp8k8o",
      "public/Airdox Pirate Studio_17.12.2025.mp3": "https://mega.nz/file/oEESQB6B#XOCFmZbNutcE5R-zZDZSTdCF3jD7jbTezSnGgfoH138",
      "public/Airdox Pirate Studio_17.12.2025.txt": "https://mega.nz/file/FNsFFQIS#UG5PRDKb8xQSZflaC8vDOg69ciDi40luWyrfwX4fnd0",
      "public/Airdox Pirate-Studio 3_12_2025.mp3": "https://mega.nz/file/9MM22bha#-mVgCPrhKJXJN3utyjU6hhmtRpymYOhZRA8Cc7S3eJg",
      "public/Airdox vs Jette_sollte nicht sein_2024_02_full.mp3": "https://mega.nz/file/wIMGlQ7C#PrptJVl79sHb1HTqcLyM2Lr8F0Ue0doCUdf4XB6yBsE",
      "public/Airdox_REC_2026_03_09.mp3": "https://mega.nz/file/gdkClRAD#qxjli-DMTkjh4DSsv0sMtVkiqkqBBGziHt9bXUlj_DM",
      "public/Airdox_REC_2026_03_15.mp3": "https://mega.nz/file/tA1QQCAb#0P_BOT8Hfrpy4QkXi5VWYF0_X7HlXa3-9AMVthss0s4",
      "public/Airdox_Secret_Set_Pirate_Studio_22_12_2025_full.mp3": "https://mega.nz/file/1IkygCQJ#3fKP6JVM3W6u2cIsKnya1CWNc5UYqMxt7Vt5D2bM4zg",
      "public/Airdox_tschau_märkische_full.mp3": "https://mega.nz/file/tFNF3ZqD#UjqsHZjI_W28tLD5776l3W2_aWKOPrwBlSwgmpVdAkA",
      "public/LIESMICH.txt": "https://mega.nz/file/AYdFmBRB#mYc5rjXDe9H2d4gV9sJVYArF7kPJcE1ONbHe_KMueqo",
      "public/Over and OUt_full.mp3": "https://mega.nz/file/xFMFyDJQ#y4tVaSvNOK6aMPMqLK0AAwse8ZltwXxZBOYESVmCNs4",
      "public/TEMP_01 REC-2026-03-06.mp3": "https://mega.nz/file/ZUEQHKRJ#Hzr_SeL8RZlWh5OAeSIiSTTOxTDmr9ESgQyK1HV3EdY",
      "public/ohboy_full.mp3": "https://mega.nz/file/wcd3jDLT#tv7kXbuZxLwr6U7Z0GVN3079LJeRFlM_en587b9RzUs",
      "vip/LIESMICH.txt": "https://mega.nz/file/0QFnlSSI#u_99P2itZTmKvLx_IPDeACGjxwxJUGZWLjbPmUipxy4"
    };

    const megaUrl = megaLinks[decodedPath];

    if (megaUrl) {
        // Redirect to Mega.nz (Note: Mega.nz links are not direct file links, 
        // but for a 100% free stack without a dedicated proxy server, 
        // this is the most reliable way to host large files.)
        return Response.redirect(megaUrl, 302);
    }

    return new Response('File not found', { status: 404 });
}
