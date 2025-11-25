import { PricingCategory } from './types';

export const APP_NAME = "Oddaj Amora";
export const ADDRESS = "ul. Mickiewicza 39, 15-213 Białystok";
export const PHONE = "+48 884 343 148";
export const EMAIL = "galeriarowerowapl@gmail.com";

export const REGULATION_POINTS = [
  "Akceptacja niniejszego regulaminu jest warunkiem koniecznym przyjęcia sprzętu do serwisu.",
  "Serwis zastrzega sobie prawo do weryfikacji i korekty zakresu prac po rozebraniu komponentu.",
  "W przypadku przekroczenia wstępnej wyceny o więcej niż 20%, Klient zostanie poinformowany telefonicznie przed podjęciem dalszych prac.",
  "Na wykonane usługi udzielamy 12-miesięcznej gwarancji rozruchowej (z wyłączeniem części eksploatacyjnych).",
  "Nieodebranie sprzętu w terminie 30 dni od powiadomienia o zakończeniu serwisu skutkuje naliczeniem opłaty magazynowej w wysokości 5 PLN za każdą dobę."
];

export const PRICING_DATA: PricingCategory[] = [
  {
    id: 'FRONT',
    title: 'Amortyzatory Przednie',
    brands: [
      {
        name: 'Rock Shox',
        rows: [
          { model: 'Tora, Paragon, XC', priceService: '250', priceFull: '780' },
          { model: 'Judy, Sektor, Recon', priceService: '250', priceFull: '850 / 900' },
          { model: '30', priceService: '250', priceFull: '850' },
          { model: 'Bluto, Reba', priceService: '260', priceFull: null },
          { model: 'SID Motion Control', priceService: '260', priceFull: null },
          { model: 'SID Charger / Race Day', priceService: '300', priceFull: null },
          { model: 'SID Brain', priceService: '380', priceFull: '670' },
          { model: 'Revelation, Yari, Lyrik, Pike, Boxxer MC/Charger', priceService: '250-300', priceFull: '560-690' },
          { model: 'RS-1 / Brain', priceService: '270 / 350', priceFull: '670' },
          { model: 'Serwis zerowy', priceService: '120-180', priceFull: null },
        ]
      },
      {
        name: 'FOX',
        rows: [
          { model: '32', priceService: '300', priceFull: '780' },
          { model: '34', priceService: '300', priceFull: '850' },
          { model: '36', priceService: '300-350', priceFull: '850' },
          { model: '38', priceService: '300', priceFull: '900' },
          { model: '40-49', priceService: '350', priceFull: '900' },
        ]
      },
      {
        name: 'Manitou',
        rows: [
          { model: 'R7, Minute, Markhor, M30, Magnum, Mastodone, Machete, Circus', priceService: '240', priceFull: null },
          { model: 'Mattoc, Travis, Dorado, Mezzer', priceService: '300', priceFull: null },
        ]
      },
      {
        name: 'DT Swiss',
        rows: [
          { model: 'Modele 32/35', priceService: '300', priceFull: null },
        ]
      },
      {
        name: 'SR Suntour',
        rows: [
          { model: 'Epicon, Epixon, XR, Raidon, Axon', priceService: '250', priceFull: null },
          { model: 'Aion, Auron, Durolux, Rux', priceService: '280', priceFull: null },
        ]
      },
      {
        name: 'Cannondale',
        rows: [
           { model: 'Z osobną gumową na ładzę', priceService: '450', priceFull: null },
           { model: 'Bez osłony gumowej / Ocho / Oliver', priceService: '500', priceFull: null },
           { model: 'Fatty', priceService: '350', priceFull: null },
        ]
      },
      {
        name: 'DVO',
        rows: [
           { model: 'Wszystkie modele', priceService: '300', priceFull: null }
        ]
      },
      {
        name: 'Ohlins',
        rows: [
           { model: 'Serwis olejowy', priceService: '300', priceFull: null },
           { model: 'Serwis pełny 100h', priceService: '1000', priceFull: null },
           { model: 'Serwis 200h', priceService: '1300', priceFull: null }
        ]
      },
      {
        name: 'Marzocchi',
        rows: [
           { model: '30-32', priceService: '300', priceFull: null },
           { model: '35', priceService: '300', priceFull: null },
           { model: '38', priceService: '330', priceFull: null }
        ]
      }
    ]
  },
  {
    id: 'REAR',
    title: 'Amortyzatory Tylne (Dampery)',
    brands: [
      {
        name: 'Rock Shox',
        rows: [
          { model: 'Kage, Vivid Coil/Air', priceService: '260 / 280 / 450', priceFull: null },
          { model: 'Super Deluxe Coil/Air', priceService: '280 / 320', priceFull: null },
          { model: 'Brain, Deluxe ReAktiv', priceService: '380 / 360', priceFull: null },
          { model: 'Monarch/Monarch+/Deluxe+', priceService: '300', priceFull: null },
          { model: 'Serwis zerowy', priceService: '120-180', priceFull: null },
        ]
      },
      {
        name: 'FOX',
        rows: [
          { model: 'Float DPS/CTD/X/2', priceService: '300', priceFull: '590' },
          { model: 'RC/RL/RP2/23/R/DHX', priceService: '300', priceFull: '590' },
          { model: 'Triad/DRCJ/Triad', priceService: '300', priceFull: '670' },
          { model: 'Van R/RC/DHX...', priceService: '300', priceFull: '560' },
          { model: 'Float X2/DPX2/DHX X2', priceService: '340', priceFull: '690' },
          { model: 'IsoStrut', priceService: '750', priceFull: null },
          { model: 'Brain', priceService: '380', priceFull: '670' },
          { model: 'Serwis zerowy', priceService: '120-180', priceFull: null },
        ]
      },
      {
        name: 'Manitou',
        rows: [
           { model: 'Swinger, McLeod, Radium, Mara, Swinger Coil, Revox/Metel', priceService: '250 / 300', priceFull: null }
        ]
      },
      {
        name: 'DT Swiss',
        rows: [
          { model: 'Equalizer', priceService: '350', priceFull: null }
        ]
      },
      {
        name: 'SR Suntour',
        rows: [
           { model: 'Wszystkie modele Air', priceService: '280', priceFull: null }
        ]
      },
      {
        name: 'DVO',
        rows: [
           { model: 'Wszystkie modele', priceService: '270', priceFull: null }
        ]
      },
      {
        name: 'Ohlins',
        rows: [
           { model: 'Serwis olejowy', priceService: '350', priceFull: null },
           { model: 'Serwis pełny 100h', priceService: '750', priceFull: null },
           { model: 'TTX22 Air 200h', priceService: '950', priceFull: null }
        ]
      },
      {
        name: 'Cane Creek',
        rows: [
           { model: 'Wszystkie modele', priceService: '300', priceFull: null }
        ]
      },
      {
        name: 'Marzocchi',
        rows: [
           { model: 'Wszystkie modele', priceService: '300', priceFull: null }
        ]
      }
    ]
  },
  {
    id: 'OTHER',
    title: 'Inne Usługi',
    services: [
      { name: 'Montaż i demontaż dampera do ramy', price: '50-100' },
      { name: 'Montaż/Demontaż amortyzatora w rowerze (zależnie od skomplikowania)', price: '60-100' },
      { name: 'Montaż i demontaż sztycy regulowanej (np. Reverb)', price: '30-100' },
      { name: 'Sztyce z nierozbieralnym kartridżem', price: '150' },
      { name: 'Sztyce hydrauliczne w pełni rozbieralne', price: '200-250' },
      { name: 'Sztyce mechaniczne', price: '150' }
    ]
  }
];

export const FULL_REGULATIONS = `REGULAMIN SERWISU AMORTYZATORÓW ROWEROWYCH oddajamora.pl
Obowiązuje od dnia [24.11.2025]

I. Postanowienia Ogólne
1.1. Właściciel Serwisu:
• Pełna nazwa: GALERIA ROWEROWA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ
• Adres rejestrowy (siedziby): UL. RZEMIEŚLNICZA 40 / 10, 15-773 BIAŁYSTOK
• NIP: 5423481883
• Numer KRS: 0001091783
• Adres e-mail: galeriarowerowapl@gmail.com
• Numer telefonu: 884 343 148

1.2. Zakres Regulaminu: Regulamin określa zasady przyjmowania, diagnozowania, wyceny, realizacji i odbioru usług serwisowych (zwanych dalej "Usługą" lub "Serwisem") amortyzatorów rowerowych ("Amortyzator") świadczonych przez Serwis oddajamora.pl.

1.3. Klient: Osoba fizyczna, osoba prawna lub jednostka organizacyjna bez osobowości prawnej, zlecająca wykonanie Usługi Serwisowej.

II. Przyjmowanie Zlecenia Serwisowego
2.1. Złożenie Zlecenia: Klient składa zlecenie serwisowe poprzez formularz na stronie oddajamora.pl, drogą e-mailową lub osobiście w punkcie Serwisu.

2.2. Wysyłka Sprzętu: Klient zobowiązuje się do wysłania Amortyzatora do Serwisu na własny koszt i ryzyko, odpowiednio zabezpieczonego na czas transportu, wraz z potwierdzeniem złożenia zlecenia (jeśli jest wymagane).

2.3. Stan Sprzętu: Klient powinien dostarczyć sprzęt w stanie umożliwiającym jego serwis (wstępnie oczyszczony). Serwis ma prawo odmówić przyjęcia lub naliczyć opłatę za czyszczenie, jeśli stan sprzętu utrudnia lub uniemożliwia rzetelną diagnozę/wykonanie Usługi.

2.4. Wymagania: Klient powinien precyzyjnie opisać problem i oczekiwany zakres Usługi (np. mały serwis, pełny serwis).

III. Diagnoza, Wycena i Akceptacja Zlecenia
3.1. Wstępna Diagnoza i Wycena:
• Po otrzymaniu Amortyzatora, Serwis dokonuje jego wstępnej diagnozy, a następnie przygotowuje szczegółową wycenę (Wycena).
• Wycena jest przedstawiana Klientowi drogą elektroniczną i obejmuje Koszty Robocizny, Koszty Niezbędnych Części Zamiennych oraz Koszt przesyłki zwrotnej.
• Czas na przedstawienie Wyceny wynosi standardowo do 3 dni roboczych od daty dostarczenia Amortyzatora.
• Akceptacja Wyceny przez Klienta jest warunkiem rozpoczęcia realizacji Usługi. Brak akceptacji w terminie 7 dni kalendarzowych traktowany jest jako rezygnacja z Serwisu.

3.2. Opłata za Diagnozę i Rezygnację:
• W przypadku, gdy Klient zrezygnuje z realizacji Usługi po przedstawieniu Wyceny, Serwis zastrzega sobie prawo do naliczenia Opłaty za Diagnozę w wysokości 80,00 PLN brutto.
• W przypadku realizacji Usługi, Opłata za Diagnozę jest wliczana w całkowity koszt Serwisu.
• W przypadku rezygnacji, Klient jest zobowiązany do uiszczenia Opłaty za Diagnozę oraz kosztów przesyłki zwrotnej. Amortyzator zostanie odesłany po zaksięgowaniu Opłaty.

3.3. Zmiany w Zakresie Prac:
• Jeżeli w trakcie Serwisu ujawnią się usterki wymagające użycia dodatkowych części, Serwis skontaktuje się z Klientem w celu przedstawienia Aktualizacji Wyceny.
• Wykonanie prac objętych Aktualizacją Wyceny wymaga ponownej akceptacji przez Klienta.

IV. Realizacja Usługi, Płatność i Wysyłka Zwrotna
4.1. Termin Realizacji: Serwis przystępuje do realizacji Usługi niezwłocznie po akceptacji Wyceny. Przewidywany czas realizacji jest podawany Klientowi w Wycenie i może ulec wydłużeniu w przypadku konieczności sprowadzenia części.

4.2. Warunki Płatności: Płatność za wykonaną Usługę (wraz z kosztami przesyłki zwrotnej lub Opłatą za Diagnozę) musi zostać uregulowana przed wysyłką zwrotną lub przed odbiorem osobistym Amortyzatora.

4.3. Wysyłka Zwrotna: Wysyłka Amortyzatora następuje w ciągu 1 dnia roboczego od momentu zaksięgowania pełnej płatności.

4.4. Nieodebrany Sprzęt: W przypadku nieodebrania sprzętu lub braku płatności w terminie 30 dni kalendarzowych od dnia powiadomienia o zakończeniu Serwisu, Serwis zastrzega sobie prawo do naliczenia opłaty za magazynowanie w wysokości 5 PLN brutto za każdy kolejny dzień. Po upływie 60 dni Serwis może podjąć kroki prawne w celu odzyskania należności lub utylizacji sprzętu.

V. Reklamacje i Gwarancja Usługi Serwisowej
5.1. Podstawy Reklamacji: Serwis ponosi odpowiedzialność za wady wykonanej Usługi na zasadach określonych w Kodeksie Cywilnym (Rękojmia) oraz udziela Gwarancji.

5.2. Gwarancja Serwisu:
• Serwis udziela Klientowi Gwarancji na wykonaną Usługę (robocizna) oraz na zamontowane części zamienne na okres 12 (dwunastu) miesięcy, licząc od dnia wydania/wysłania Amortyzatora Klientowi.

5.3. Wyłączenia Gwarancji: Gwarancja Serwisu nie obejmuje uszkodzeń lub wad powstałych wskutek:
• Uszkodzeń Mechanicznych (np. uszkodzenia goleni, korony, upadki, kolizje).
• Nieprawidłowej Eksploatacji (np. mycie myjkami ciśnieniowymi, zaniedbanie czyszczenia).
• Normalnego Zużycia elementów niebędących częścią Serwisu.
• Wad Części Niewymienionych na wyraźne życzenie Klienta, mimo zalecenia Serwisu.
• Samodzielnej Naprawy lub ingerencji w mechanizmy Amortyzatora po wykonaniu Serwisu.

5.4. Procedura Reklamacyjna:
• Reklamację należy złożyć pisemnie (list polecony lub e-mail) i dostarczyć reklamowany Amortyzator do Serwisu na własny koszt wraz z numerem zlecenia.
• Serwis rozpatrzy reklamację w terminie 14 dni kalendarzowych od dnia otrzymania Amortyzatora i kompletnego zgłoszenia.

VI. Postanowienia Końcowe
6.1. Odstąpienie od Umowy (Świadczenie Usługi):
• Prawo odstąpienia od umowy nie przysługuje Klientowi, jeżeli Serwis wykonał w pełni Usługę za wyraźną zgodą Klienta, który został poinformowany o utracie tego prawa z chwilą spełnienia świadczenia (zgodnie z art. 38 pkt 1 Ustawy o Prawach Konsumenta).

6.2. Ochrona Danych Osobowych:
• Administratorem danych osobowych jest GALERIA ROWEROWA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ.
• Szczegółowe zasady przetwarzania danych określa odrębny dokument Polityka Prywatności Serwisu oddajamora.pl, dostępny na stronie internetowej.

6.3. Postanowienia Końcowe:
• Serwis zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn. Zmiany wchodzą w życie po upływie 14 dni od ich publikacji.
• W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu Cywilnego oraz Ustawy o Prawach Konsumenta.`;

export const PRIVACY_POLICY = `Polityka Prywatności i Klauzula Informacyjna RODO serwisu oddajamora.pl

Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników w związku z korzystaniem z serwisu internetowego oddajamora.pl.
Dokument ten wypełnia obowiązek informacyjny wynikający z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).

I. Administrator Danych Osobowych
Administratorem Twoich danych osobowych jest:
Galeria Rowerowa Sp. z o.o. ul. Rzemieślnicza 40/10 15-773 Białystok NIP: 5423481883 REGON: 527980329

Kontakt z Administratorem jest możliwy za pośrednictwem:
Poczty elektronicznej: galeriarowerowapl@gmail.com
Telefonu: 884 343 148

II. Cele i podstawy prawne przetwarzania danych
Twoje dane osobowe przetwarzane są w następujących celach:

1. Realizacja usług serwisowych: W celu przyjęcia zgłoszenia, wykonania serwisu amortyzatora/dampera oraz kontaktu w sprawie naprawy.
Podstawa prawna: Niezbędność do wykonania umowy (Art. 6 ust. 1 lit. b RODO).

2. Założenie i prowadzenie konta Użytkownika: W celu umożliwienia Ci podglądu historii zgłoszeń i statusu naprawy w bazie danych serwisu.
Podstawa prawna: Niezbędność do wykonania umowy o świadczenie usług drogą elektroniczną (Art. 6 ust. 1 lit. b RODO).

3. Kontakt (Formularz/E-mail/Telefon): W celu udzielania odpowiedzi na zadane pytania dotyczące usług, terminów czy wyceny.
Podstawa prawna: Prawnie uzasadniony interes Administratora – komunikacja z klientem (Art. 6 ust. 1 lit. f RODO).

4. Wysyłka powiadomień mailowych: Informowanie o zmianie statusu naprawy (np. "Sprzęt gotowy do odbioru").
Podstawa prawna: Niezbędność do wykonania umowy (Art. 6 ust. 1 lit. b RODO).

5. Cele księgowe i podatkowe: Wystawianie faktur i prowadzenie dokumentacji księgowej.
Podstawa prawna: Wypełnienie obowiązku prawnego ciążącego na Administratorze (Art. 6 ust. 1 lit. c RODO).

III. Odbiorcy danych
W związku z realizacją usług, Twoje dane mogą być przekazywane zaufanym podmiotom współpracującym z Administratorem, wyłącznie w niezbędnym zakresie:
- Dostawcy usług IT i hostingu: Podmioty dostarczające infrastrukturę serwera, bazy danych oraz poczty elektronicznej niezbędnej do działania serwisu oddajamora.pl.
- Firmy kurierskie: W przypadku wybrania opcji wysyłki zwrotnej sprzętu (np. InPost, DPD).
- Biuro rachunkowe: W celu realizacji obowiązków podatkowych.
- Google Ireland Limited: W zakresie korzystania z usługi Mapy Google zaimplementowanej na stronie (patrz sekcja Pliki Cookies).

IV. Prawa Użytkownika
Zgodnie z RODO przysługują Ci następujące prawa:
- Prawo dostępu do treści swoich danych.
- Prawo do sprostowania (poprawiania) danych.
- Prawo do usunięcia danych ("prawo do bycia zapomnianym") – o ile nie stoją temu na przeszkodzie przepisy prawa (np. podatkowego).
- Prawo do ograniczenia przetwarzania.
- Prawo do przenoszenia danych.
- Prawo wniesienia sprzeciwu.
- Prawo wniesienia skargi do organu nadzorczego (Prezesa Urzędu Ochrony Danych Osobowych), jeśli uznasz, że przetwarzanie narusza przepisy RODO.

V. Okres przechowywania danych
Dane związane z realizacją zgłoszenia serwisowego i konta będą przechowywane przez okres świadczenia usługi oraz po jej zakończeniu przez okres przedawnienia ewentualnych roszczeń (zazwyczaj 3 lub 6 lat).
Dane zawarte na fakturach/rachunkach przechowywane są przez okres 5 lat, licząc od końca roku kalendarzowego, w którym upłynął termin płatności podatku.
Dane przetwarzane na podstawie zgody lub prawnie uzasadnionego interesu (np. zapytania z formularza) będą przetwarzane do momentu wycofania zgody lub zgłoszenia skutecznego sprzeciwu, lub do momentu zrealizowania celu (udzielenia odpowiedzi).

VI. Pliki Cookies i Mapy Google
Serwis oddajamora.pl wykorzystuje pliki cookies (tzw. "ciasteczka").

Cookies niezbędne: Wykorzystywane do prawidłowego działania strony, logowania do konta i utrzymania sesji Użytkownika.

Mapy Google: Na stronie zintegrowana jest usługa Google Maps, która umożliwia wyświetlenie lokalizacji serwisu. Korzystanie z tej funkcji może wiązać się z pobieraniem plików cookies przez firmę Google oraz przetwarzaniem Twojego adresu IP przez Google zgodnie z ich polityką prywatności.

Użytkownik ma możliwość samodzielnej zmiany ustawień dotyczących plików cookies w swojej przeglądarce internetowej.

VII. Postanowienia końcowe
Administrator stosuje środki techniczne i organizacyjne zapewniające ochronę przetwarzanych danych osobowych odpowiednią do zagrożeń oraz kategorii danych objętych ochroną (m.in. szyfrowanie połączenia SSL). Administrator zastrzega sobie prawo do zmian w Polityce Prywatności w przypadku zmian przepisów prawa lub technologii serwisu.`;