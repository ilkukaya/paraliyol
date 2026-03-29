#!/usr/bin/env python3
"""Generate highway-network.json with all stations, coordinates, junctions and crossings."""
import json, math

def interpolate_coords(waypoints, n_stations):
    if n_stations <= 1:
        return [waypoints[0]] * n_stations
    cum_dist = [0]
    for i in range(1, len(waypoints)):
        d = math.sqrt((waypoints[i][0]-waypoints[i-1][0])**2 + (waypoints[i][1]-waypoints[i-1][1])**2)
        cum_dist.append(cum_dist[-1] + d)
    total = cum_dist[-1]
    coords = []
    for i in range(n_stations):
        t = i / (n_stations - 1) * total
        for j in range(len(cum_dist)-1):
            if t <= cum_dist[j+1] or j == len(cum_dist)-2:
                seg_len = cum_dist[j+1] - cum_dist[j]
                frac = 0 if seg_len == 0 else (t - cum_dist[j]) / seg_len
                lat = waypoints[j][0] + frac * (waypoints[j+1][0] - waypoints[j][0])
                lng = waypoints[j][1] + frac * (waypoints[j+1][1] - waypoints[j][1])
                coords.append((round(lat, 4), round(lng, 4)))
                break
    return coords

highway_waypoints = {
    "O-4": [(40.98, 29.09), (40.92, 29.27), (40.80, 29.43), (40.76, 29.65), (40.76, 29.94), (40.69, 30.44), (40.72, 30.78), (40.84, 31.16), (40.74, 31.61), (40.80, 32.20), (40.30, 32.45), (39.97, 32.55)],
    "O-3": [(41.06, 28.83), (41.10, 28.63), (41.14, 28.46), (41.07, 28.25), (41.07, 28.10), (41.12, 27.95), (41.16, 27.80), (41.22, 27.60), (41.40, 27.35), (41.44, 27.12), (41.52, 26.85), (41.68, 26.56)],
    "O-5": [(40.52, 29.09), (40.49, 29.15), (40.46, 29.05), (40.38, 28.90), (40.25, 28.75), (40.10, 28.60), (39.90, 28.40), (39.65, 28.15), (39.40, 27.90), (39.10, 27.70), (38.80, 27.50), (38.60, 27.35), (38.46, 27.20)],
    "O-21": [(37.87, 32.49), (38.37, 34.03), (39.85, 32.85)],
    "O-31": [(36.90, 30.72), (37.80, 32.50)],
    "O-51": [(37.05, 34.40), (37.00, 34.50), (36.93, 34.55), (36.87, 34.58), (36.83, 34.60), (36.81, 34.64), (36.85, 34.70), (36.88, 34.78), (36.90, 34.85), (36.92, 34.90), (36.95, 34.95), (36.98, 35.10), (37.00, 35.18), (36.95, 34.75), (36.99, 35.08)],
    "O-52": [(37.00, 35.40), (36.95, 35.70), (36.90, 35.90), (36.87, 36.00), (37.05, 36.15), (37.08, 36.20), (36.95, 36.30), (36.78, 36.00), (36.70, 36.20), (36.62, 36.35), (36.60, 36.40), (36.58, 36.17), (37.00, 36.50), (37.02, 36.60), (37.05, 36.80), (37.06, 37.10), (37.07, 37.38)],
    "KCY": [(41.10, 29.18), (41.13, 29.12), (41.16, 29.08), (41.17, 29.04), (41.10, 29.00), (41.22, 28.98), (41.15, 28.95), (41.11, 28.90), (41.18, 28.88), (41.20, 28.84), (41.23, 29.02), (41.21, 29.06)],
    "KMO-AV": [(41.15, 28.92), (41.17, 28.85), (41.18, 28.78), (41.20, 28.72), (41.16, 28.55), (41.10, 28.30), (41.07, 28.10)],
    "KMO-AN": [(41.10, 29.25), (41.05, 29.40), (40.95, 29.55), (40.90, 29.65), (40.85, 29.75), (40.92, 29.35), (40.82, 29.92), (40.72, 30.30), (40.68, 30.60), (41.08, 29.20), (40.82, 29.42), (40.73, 30.40), (40.70, 30.50), (40.76, 30.70)],
    "MAC": [(38.62, 26.95), (38.56, 26.98), (38.73, 26.95), (38.67, 27.02), (38.64, 26.82), (38.62, 26.88), (38.68, 26.80)],
    "ANO": [(39.85, 32.75), (39.70, 32.85), (39.55, 33.05), (39.40, 33.25), (39.25, 33.50), (39.10, 33.70), (38.95, 33.90), (38.80, 34.00), (38.65, 34.10), (38.50, 34.15), (38.35, 34.20), (38.20, 34.25), (38.05, 34.35), (37.95, 34.65)],
    "MCO": [(40.35, 26.65), (41.10, 27.20), (41.05, 27.00)],
    "ADO": [(37.85, 29.00), (37.83, 29.08), (37.80, 28.90), (37.78, 28.95), (37.76, 28.98), (37.75, 28.85), (37.82, 29.05), (37.77, 28.88), (37.74, 28.92), (37.73, 28.95), (37.72, 29.10)],
    "IZC": [(38.42, 26.92), (38.40, 26.78), (38.45, 26.65), (38.38, 26.45), (38.33, 26.38), (38.30, 26.30)],
    "IZA": [(38.45, 27.10), (38.43, 27.18), (38.35, 27.30), (38.25, 27.50), (38.10, 27.80), (37.85, 27.85)],
    "GSO": [(37.07, 37.38), (37.10, 37.70), (37.05, 38.00), (37.15, 38.60), (37.16, 38.80)],
}

highway_stations = {
    "O-4": ["o4-anadolu-camlica","o4-samandira","o4-sultanbeyli","o4-meci-di-ye","o4-kurtkoy","o4-orhanli","o4-s-pinar","o4-gebze-org-san-bolgeleri","o4-gebze","o4-mualli-mkoy","o4-li-man","o4-di-l-i-skelesi","o4-bati-hereke","o4-korfez","o4-kandira","o4-bati-i-zmi-t","o4-kartepe","o4-dogu-i-zmi-t","o4-sapanca","o4-adapazari","o4-beki-rpasa","o4-akyazi","o4-topagac","o4-hendek","o4-duzce-golyaka","o4-duzce-organi-ze-san","o4-kaynasli","o4-abant","o4-bolu-bati","o4-caydurt","o4-yeni-caga","o4-dortdi-van","o4-gerede","o4-peli-tci-k-camlidere","o4-celti-kci-kizilcahamam","o4-akinci"],
    "O-3": ["o3-mahmutbey","o3-ispartakule","o3-avcilar","o3-esenyurt","o3-hadimkoy","o3-catalca","o3-k-burgaz","o3-seli-mpasa","o3-si-li-vri","o3-kinali","o3-kucukilicli","o3-cerkezkoy","o3-corlu","o3-saray","o3-luleburgaz","o3-babaeski","o3-havsa","o3-edi-rne"],
    "O-5": ["o5-osmangazi-koprusu-i-zmir-yonu-bursa-bati","o5-altinova-teknosab","o5-kilic-karacabey-mustafakemalpasa-1","o5-orhangazi-karacabey-mustafakemalpasa-2","o5-gemlik-susurluk","o5-bursa-serbest-bolge-balikesir-kuzey","o5-bursa-kuzey-balikesir-bati","o5-savastepe","o5-kirkagac","o5-akhisar","o5-saruhanli","o5-turgutlu","o5-i-zmir"],
    "O-21": ["o21-konya","o21-aksaray","o21-ankara-guney"],
    "O-31": ["o31-antalya","o31-konya-guney"],
    "O-51": ["o51-guney","o51-kuzey","o51-alin","o51-golcuk-alin","o51-kemerhi-sar","o51-mersi-n-alin","o51-teki-r","o51-emi-nli-k-alin","o51-tarsus-osb","o51-pozanti-kuzey","o51-camalan","o51-adana-bati-alin","o51-camtepe","o51-tarsus","o51-yeni-ce"],
    "O-52": ["o52-adana-dogu-alin","o52-ceyhan","o52-toprakkale","o52-sakizgedi-gi","o52-osmani-ye","o52-osmani-ye-org-san","o52-erzi-n","o52-yumurtalik-serbest-b","o52-dortyol","o52-payas","o52-i-skenderun-osb","o52-i-skenderun","o52-duzi-ci","o52-bahce","o52-komurler-nurdagi","o52-narli","o52-gazi-antep-bati-alin"],
    "KCY": ["kcy-kurnakoy","kcy-huseyinli","kcy-resadiye","kcy-agacli","kcy-alemdag","kcy-odayeri","kcy-pasakoy","kcy-mecidiye","kcy-uskumrukoy","kcy-fenertepe","kcy-riva","kcy-isiklar"],
    "KMO-AV": ["kmoav-fati-h","kmoav-nakkas","kmoav-tayakadin","kmoav-yassioren","kmoav-catalca","kmoav-si-li-vri","kmoav-kinali"],
    "KMO-AN": ["kmoan-mermerci-ler","kmoan-i-zmi-t-dogu","kmoan-tem-akyazi","kmoan-i-li-mtepe","kmoan-sevi-ndi-kli","kmoan-i-stanbulpark","kmoan-i-zmi-t-kuzey","kmoan-adapazari-1","kmoan-kmo-akyazi","kmoan-kurnakoy-2","kmoan-balcik","kmoan-adapazari-2","kmoan-akmese","kmoan-karasu"],
    "MAC": ["mac-ali-aga-osb","mac-menemen","mac-candarli","mac-ali-aga-petki-m","mac-eski-foca","mac-yeni-foca","mac-yeni-sakran"],
    "ANO": ["ano-ankara-alin","ano-karagedik","ano-ahiboz","ano-emirler","ano-kulu-kirikkale","ano-acikuyu","ano-evren-sariyahsi","ano-agacoren","ano-kirsehir","ano-ortakoy","ano-alayhan","ano-derinkuyu","ano-ciftlik","ano-nigde-alin"],
    "MCO": ["mco-kuzey-g-3-guney-g-4-koprusu-g-5","mco-malkara-g-1","mco-kavakkoy-g-2"],
    "ADO": ["ado-buharkent","ado-pamukkale","ado-kosk","ado-saraykoy","ado-kumkisik-a","ado-yeni-pazar","ado-kocabas","ado-nazi-lli","ado-kumkisik-b","ado-kuyucak","ado-aydin-alin"],
    "IZC": ["izc-seferi-hi-sar","izc-urla","izc-karaburun","izc-zeyti-nler","izc-alacati","izc-cesme"],
    "IZA": ["iza-isikkent","iza-tahtalicay","iza-torbali","iza-belevi","iza-germenci-k","iza-aydin-bati"],
    "GSO": ["gso-gazi-antep-dogu","gso-ni-zi-p","gso-bi-reci-k","gso-suruc","gso-sanliurfa"],
}

station_names = {
    "o4-anadolu-camlica":"Anadolu (Çamlıca)","o4-samandira":"Samandıra","o4-sultanbeyli":"Sultanbeyli",
    "o4-meci-di-ye":"Mecidiye","o4-kurtkoy":"Kurtköy","o4-orhanli":"Orhanlı","o4-s-pinar":"Şerifpınar",
    "o4-gebze-org-san-bolgeleri":"Gebze OSB","o4-gebze":"Gebze","o4-mualli-mkoy":"Muallimköy",
    "o4-li-man":"Liman","o4-di-l-i-skelesi":"Diliskelesi","o4-bati-hereke":"Batı Hereke",
    "o4-korfez":"Körfez","o4-kandira":"Kandıra","o4-bati-i-zmi-t":"Batı İzmit",
    "o4-kartepe":"Kartepe","o4-dogu-i-zmi-t":"Doğu İzmit","o4-sapanca":"Sapanca",
    "o4-adapazari":"Adapazarı","o4-beki-rpasa":"Bekirpaşa","o4-akyazi":"Akyazı",
    "o4-topagac":"Topağaç","o4-hendek":"Hendek","o4-duzce-golyaka":"Düzce/Gölyaka",
    "o4-duzce-organi-ze-san":"Düzce OSB","o4-kaynasli":"Kaynaşlı","o4-abant":"Abant",
    "o4-bolu-bati":"Bolu Batı","o4-caydurt":"Çaydurt","o4-yeni-caga":"Yeniçağa",
    "o4-dortdi-van":"Dörtdivan","o4-gerede":"Gerede","o4-peli-tci-k-camlidere":"Pelitçik/Çamlıdere",
    "o4-celti-kci-kizilcahamam":"Çeltikçi/Kızılcahamam","o4-akinci":"Akıncı",
    "o3-mahmutbey":"Mahmutbey","o3-ispartakule":"İspartakule","o3-avcilar":"Avcılar",
    "o3-esenyurt":"Esenyurt","o3-hadimkoy":"Hadımköy","o3-catalca":"Çatalca",
    "o3-k-burgaz":"Küçükburgaz","o3-seli-mpasa":"Selimpaşa","o3-si-li-vri":"Silivri",
    "o3-kinali":"Kınalı","o3-kucukilicli":"Küçükilicli","o3-cerkezkoy":"Çerkezköy",
    "o3-corlu":"Çorlu","o3-saray":"Saray","o3-luleburgaz":"Lüleburgaz",
    "o3-babaeski":"Babaeski","o3-havsa":"Havsa","o3-edi-rne":"Edirne",
    "o5-osmangazi-koprusu-i-zmir-yonu-bursa-bati":"Osmangazi Köprüsü (İzmir Yönü)",
    "o5-altinova-teknosab":"Altınova/Teknosab",
    "o5-kilic-karacabey-mustafakemalpasa-1":"Kılıç/Karacabey/MKP-1",
    "o5-orhangazi-karacabey-mustafakemalpasa-2":"Orhangazi/Karacabey/MKP-2",
    "o5-gemlik-susurluk":"Gemlik/Susurluk",
    "o5-bursa-serbest-bolge-balikesir-kuzey":"Bursa SB / Balıkesir Kuzey",
    "o5-bursa-kuzey-balikesir-bati":"Bursa Kuzey / Balıkesir Batı",
    "o5-savastepe":"Savaştepe","o5-kirkagac":"Kırkağaç","o5-akhisar":"Akhisar",
    "o5-saruhanli":"Saruhanlı","o5-turgutlu":"Turgutlu","o5-i-zmir":"İzmir",
    "o21-konya":"Konya","o21-aksaray":"Aksaray","o21-ankara-guney":"Ankara Güney",
    "o31-antalya":"Antalya","o31-konya-guney":"Konya Güney",
    "o51-guney":"Güney","o51-kuzey":"Kuzey","o51-alin":"Alın","o51-golcuk-alin":"Gölcük Alın",
    "o51-kemerhi-sar":"Kemerhisar","o51-mersi-n-alin":"Mersin Alın","o51-teki-r":"Tekir",
    "o51-emi-nli-k-alin":"Eminlik Alın","o51-tarsus-osb":"Tarsus OSB",
    "o51-pozanti-kuzey":"Pozantı Kuzey","o51-camalan":"Çamalan",
    "o51-adana-bati-alin":"Adana Batı Alın","o51-camtepe":"Çamtepe",
    "o51-tarsus":"Tarsus","o51-yeni-ce":"Yenice",
    "o52-adana-dogu-alin":"Adana Doğu Alın","o52-ceyhan":"Ceyhan",
    "o52-toprakkale":"Toprakkale","o52-sakizgedi-gi":"Sakızgediği",
    "o52-osmani-ye":"Osmaniye","o52-osmani-ye-org-san":"Osmaniye OSB",
    "o52-erzi-n":"Erzin","o52-yumurtalik-serbest-b":"Yumurtalık SB",
    "o52-dortyol":"Dörtyol","o52-payas":"Payas","o52-i-skenderun-osb":"İskenderun OSB",
    "o52-i-skenderun":"İskenderun","o52-duzi-ci":"Düziçi","o52-bahce":"Bahçe",
    "o52-komurler-nurdagi":"Kömürler/Nurdağı","o52-narli":"Narlı",
    "o52-gazi-antep-bati-alin":"Gaziantep Batı Alın",
    "kcy-kurnakoy":"Kurnakoy","kcy-huseyinli":"Hüseyinli","kcy-resadiye":"Reşadiye",
    "kcy-agacli":"Ağaçlı","kcy-alemdag":"Alemdağ","kcy-odayeri":"Odayeri",
    "kcy-pasakoy":"Paşaköy","kcy-mecidiye":"Mecidiye","kcy-uskumrukoy":"Üskümrüköy",
    "kcy-fenertepe":"Fenertepe","kcy-riva":"Riva","kcy-isiklar":"Işıklar",
    "kmoav-fati-h":"Fatih","kmoav-nakkas":"Nakkaş","kmoav-tayakadin":"Tayakadın",
    "kmoav-yassioren":"Yassıören","kmoav-catalca":"Çatalca",
    "kmoav-si-li-vri":"Silivri","kmoav-kinali":"Kınalı",
    "kmoan-mermerci-ler":"Mermerciler","kmoan-i-zmi-t-dogu":"İzmit Doğu",
    "kmoan-tem-akyazi":"TEM/Akyazı","kmoan-i-li-mtepe":"İlimtepe",
    "kmoan-sevi-ndi-kli":"Sevindikli","kmoan-i-stanbulpark":"İstanbulPark",
    "kmoan-i-zmi-t-kuzey":"İzmit Kuzey","kmoan-adapazari-1":"Adapazarı-1",
    "kmoan-kmo-akyazi":"KMO/Akyazı","kmoan-kurnakoy-2":"Kurnakoy-2",
    "kmoan-balcik":"Balçık","kmoan-adapazari-2":"Adapazarı-2",
    "kmoan-akmese":"Akmeşe","kmoan-karasu":"Karasu",
    "mac-ali-aga-osb":"Aliağa OSB","mac-menemen":"Menemen","mac-candarli":"Çandarlı",
    "mac-ali-aga-petki-m":"Aliağa/Petkim","mac-eski-foca":"Eski Foça",
    "mac-yeni-foca":"Yeni Foça","mac-yeni-sakran":"Yeni Şakran",
    "ano-ankara-alin":"Ankara Alın","ano-karagedik":"Karagedik","ano-ahiboz":"Ahiboz",
    "ano-emirler":"Emirler","ano-kulu-kirikkale":"Kulu/Kırıkkale","ano-acikuyu":"Açıkuyu",
    "ano-evren-sariyahsi":"Evren/Sarıyahşi","ano-agacoren":"Ağaçören",
    "ano-kirsehir":"Kırşehir","ano-ortakoy":"Ortaköy","ano-alayhan":"Alayhan",
    "ano-derinkuyu":"Derinkuyu","ano-ciftlik":"Çiftlik","ano-nigde-alin":"Niğde Alın",
    "mco-kuzey-g-3-guney-g-4-koprusu-g-5":"Kuzey (Köprü tarafı)",
    "mco-malkara-g-1":"Malkara","mco-kavakkoy-g-2":"Kavakköy",
    "ado-buharkent":"Buharkent","ado-pamukkale":"Pamukkale","ado-kosk":"Köşk",
    "ado-saraykoy":"Sarayköy","ado-kumkisik-a":"Kumkışık-A","ado-yeni-pazar":"Yenipazar",
    "ado-kocabas":"Kocabaş","ado-nazi-lli":"Nazilli","ado-kumkisik-b":"Kumkışık-B",
    "ado-kuyucak":"Kuyucak","ado-aydin-alin":"Aydın Alın",
    "izc-seferi-hi-sar":"Seferihisar","izc-urla":"Urla","izc-karaburun":"Karaburun",
    "izc-zeyti-nler":"Zeytinler","izc-alacati":"Alaçatı","izc-cesme":"Çeşme",
    "iza-isikkent":"Işıkkent","iza-tahtalicay":"Tahtalıçay","iza-torbali":"Torbalı",
    "iza-belevi":"Belevi","iza-germenci-k":"Germencik","iza-aydin-bati":"Aydın Batı",
    "gso-gazi-antep-dogu":"Gaziantep Doğu","gso-ni-zi-p":"Nizip",
    "gso-bi-reci-k":"Birecik","gso-suruc":"Suruç","gso-sanliurfa":"Şanlıurfa",
}

highway_display_names = {
    "O-4":"İstanbul-Ankara Otoyolu (Anadolu Otoyolu)",
    "O-3":"İstanbul-Edirne Otoyolu (Avrupa Otoyolu)",
    "O-5":"Gebze-Orhangazi-İzmir Otoyolu",
    "O-21":"Ankara-Konya Otoyolu","O-31":"Konya-Antalya Otoyolu",
    "O-51":"Niğde-Mersin-Adana Otoyolu (Çukurova)",
    "O-52":"Adana-Gaziantep Otoyolu (Çukurova)",
    "KCY":"YSS Kuzey Çevre Yolu",
    "KMO-AV":"Kuzey Marmara Otoyolu (Avrupa)",
    "KMO-AN":"Kuzey Marmara Otoyolu (Anadolu)",
    "MAC":"Menemen-Aliağa-Çandarlı Otoyolu",
    "ANO":"Ankara-Niğde Otoyolu",
    "MCO":"Malkara-Çanakkale Otoyolu",
    "ADO":"Aydın-Denizli Otoyolu",
    "IZC":"İzmir-Çeşme Otoyolu",
    "IZA":"İzmir-Aydın Otoyolu",
    "GSO":"Gaziantep-Şanlıurfa Otoyolu",
}

network = {"highways": {}, "junctions": [], "crossings": []}

for hw_code, stations in highway_stations.items():
    waypoints = highway_waypoints.get(hw_code, [(39.0, 30.0), (39.5, 31.0)])
    coords = interpolate_coords(waypoints, len(stations))
    station_list = []
    for i, sid in enumerate(stations):
        station_list.append({
            "id": sid,
            "name": station_names.get(sid, sid),
            "lat": coords[i][0],
            "lng": coords[i][1]
        })
    network["highways"][hw_code] = {
        "name": highway_display_names.get(hw_code, hw_code),
        "stations": station_list
    }

network["junctions"] = [
    {"stations": ["o3-kinali", "kmoav-kinali"], "name": "Kınalı Kavşağı (O-3 / KMO-AV)"},
    {"stations": ["o3-mahmutbey", "o4-anadolu-camlica"], "name": "İstanbul Bağlantısı (O-3 / O-4)"},
    {"stations": ["kmoan-kurnakoy-2", "o4-kurtkoy"], "name": "Kurtköy Kavşağı (KMO-AN / O-4)"},
    {"stations": ["kcy-kurnakoy", "kmoan-kurnakoy-2"], "name": "Kurnakoy Kavşağı (KCY / KMO-AN)"},
    {"stations": ["o4-akinci", "o21-ankara-guney"], "name": "Ankara Kavşağı (O-4 / O-21)"},
    {"stations": ["o4-akinci", "ano-ankara-alin"], "name": "Ankara Kavşağı (O-4 / ANO)"},
    {"stations": ["o21-ankara-guney", "ano-ankara-alin"], "name": "Ankara Güney (O-21 / ANO)"},
    {"stations": ["o21-konya", "o31-konya-guney"], "name": "Konya Kavşağı (O-21 / O-31)"},
    {"stations": ["ano-nigde-alin", "o51-guney"], "name": "Niğde Kavşağı (ANO / O-51)"},
    {"stations": ["o51-adana-bati-alin", "o52-adana-dogu-alin"], "name": "Adana Kavşağı (O-51 / O-52)"},
    {"stations": ["o52-gazi-antep-bati-alin", "gso-gazi-antep-dogu"], "name": "Gaziantep Kavşağı (O-52 / GSO)"},
    {"stations": ["o5-i-zmir", "iza-isikkent"], "name": "İzmir Kavşağı (O-5 / IZA)"},
    {"stations": ["o5-i-zmir", "mac-menemen"], "name": "İzmir-Menemen (O-5 / MAC)"},
    {"stations": ["iza-isikkent", "izc-seferi-hi-sar"], "name": "İzmir Kavşağı (IZA / IZC)"},
    {"stations": ["iza-aydin-bati", "ado-aydin-alin"], "name": "Aydın Kavşağı (IZA / ADO)"},
    {"stations": ["o3-kinali", "mco-malkara-g-1"], "name": "Kınalı-Malkara (O-3 / MCO)"},
]

network["crossings"] = [
    {"from": "kmoav-yassioren", "to": "kmoan-kurnakoy-2", "fixedTollId": "yavuz-sultan-selim-koprusu", "name": "Yavuz Sultan Selim Köprüsü"},
    {"from": "o4-gebze", "to": "o5-osmangazi-koprusu-i-zmir-yonu-bursa-bati", "fixedTollId": "osmangazi-koprusu", "name": "Osmangazi Köprüsü"},
    {"from": "mco-kuzey-g-3-guney-g-4-koprusu-g-5", "to": "o5-kirkagac", "fixedTollId": "1915-canakkale-koprusu", "name": "1915 Çanakkale Köprüsü"},
]

with open('data/highway-network.json', 'w', encoding='utf-8') as f:
    json.dump(network, f, ensure_ascii=False, indent=2)

print(f"Generated highway-network.json:")
print(f"  Highways: {len(network['highways'])}")
total_stations = sum(len(h['stations']) for h in network['highways'].values())
print(f"  Total stations: {total_stations}")
print(f"  Junctions: {len(network['junctions'])}")
print(f"  Crossings: {len(network['crossings'])}")
