/* ข้อมูลสถานีรถไฟระหว่างเมือง ประเทศไทย
   ที่มา: Thailand_SRT_Stations_by_Region.xlsx (ชีต "รวมทุกสาย")
   แต่ละเส้นทางย่อย (route) ใช้หลัก กม. ของตัวเอง ระยะระหว่างสถานีคำนวณจากผลต่างภายในเส้นทางเดียวกันเท่านั้น
   รูปแบบแถว:  ชื่อไทย;English;ประเภท;หลักกม.      ประเภท S=สถานี X=สถานีพิเศษ H=ที่หยุดรถ F=สถานีสินค้า
               @จังหวัด  = จังหวัดของแถวถัดไป
   geom: start = จุดเริ่ม (กม. แผนผัง), segs = [ทิศ, ความยาว กม.] ช่วงสุดท้ายยาวเท่าที่เหลือ,
         connect = เส้นทางที่ปลายทั้งสองข้างวางแล้ว ลากเชื่อมแบบ 45° ('straight' หรือ 'diag' ก่อน) */

const LINES = {
  N:  { th: 'สายเหนือ', en: 'Northern Line', color: '#D3212D' },
  NE: { th: 'สายตะวันออกเฉียงเหนือ', en: 'Northeastern Line', color: '#F08C00' },
  E:  { th: 'สายตะวันออก', en: 'Eastern Line', color: '#0A6EBD' },
  W:  { th: 'สายตะวันตก', en: 'Western Line', color: '#7D3C98' },
  S:  { th: 'สายใต้', en: 'Southern Line', color: '#00915A' },
  MK: { th: 'สายแม่กลอง', en: 'Maeklong Line', color: '#9A6431' },
};

const PROVINCES = {
  'กรุงเทพมหานคร':'Bangkok','ปทุมธานี':'Pathum Thani','พระนครศรีอยุธยา':'Phra Nakhon Si Ayutthaya','สระบุรี':'Saraburi',
  'ลพบุรี':'Lopburi','นครสวรรค์':'Nakhon Sawan','พิจิตร':'Phichit','พิษณุโลก':'Phitsanulok','อุตรดิตถ์':'Uttaradit',
  'แพร่':'Phrae','ลำปาง':'Lampang','ลำพูน':'Lamphun','เชียงใหม่':'Chiang Mai','สุโขทัย':'Sukhothai',
  'นครราชสีมา':'Nakhon Ratchasima','บุรีรัมย์':'Buriram','สุรินทร์':'Surin','ศรีสะเกษ':'Sisaket','อุบลราชธานี':'Ubon Ratchathani',
  'ขอนแก่น':'Khon Kaen','อุดรธานี':'Udon Thani','หนองคาย':'Nong Khai','ชัยภูมิ':'Chaiyaphum','ฉะเชิงเทรา':'Chachoengsao',
  'ปราจีนบุรี':'Prachinburi','นครนายก':'Nakhon Nayok','สระแก้ว':'Sa Kaeo','ชลบุรี':'Chonburi','ระยอง':'Rayong',
  'นครปฐม':'Nakhon Pathom','ราชบุรี':'Ratchaburi','สุพรรณบุรี':'Suphanburi','กาญจนบุรี':'Kanchanaburi',
  'สมุทรสาคร':'Samut Sakhon','สมุทรสงคราม':'Samut Songkhram','เพชรบุรี':'Phetchaburi','ประจวบคีรีขันธ์':'Prachuap Khiri Khan',
  'ชุมพร':'Chumphon','สุราษฎร์ธานี':'Surat Thani','นครศรีธรรมราช':'Nakhon Si Thammarat','พัทลุง':'Phatthalung',
  'สงขลา':'Songkhla','ปัตตานี':'Pattani','ยะลา':'Yala','นราธิวาส':'Narathiwat','ตรัง':'Trang',
};

const TYPES = {
  S: { th: 'สถานี', en: 'Station' },
  X: { th: 'สถานีพิเศษ', en: 'Special station' },
  H: { th: 'ที่หยุดรถ', en: 'Halt' },
  F: { th: 'สถานีสินค้า', en: 'Freight station' },
};

/* สถานีหลักที่แสดงชื่อเสมอ (นอกจากชุมทางและปลายทาง) */
const MAJOR = ['กรุงเทพ','กรุงเทพอภิวัฒน์','ดอนเมือง','อยุธยา','ลพบุรี','นครสวรรค์','พิจิตร','พิษณุโลก','อุตรดิตถ์','เด่นชัย','นครลำปาง','ลำพูน',
  'สระบุรี','ปากช่อง','นครราชสีมา','บุรีรัมย์','สุรินทร์','ศรีสะเกษ','ขอนแก่น','อุดรธานี','ลำนารายณ์','จัตุรัส',
  'ปราจีนบุรี','กบินทร์บุรี','สระแก้ว','อรัญประเทศ','ชลบุรี','พัทยา','นครปฐม','ราชบุรี','กาญจนบุรี','สุพรรณบุรี','มหาชัย','วงเวียนใหญ่',
  'เพชรบุรี','หัวหิน','ประจวบคีรีขันธ์','ชุมพร','หลังสวน','สุราษฎร์ธานี','ตรัง','พัทลุง','ปัตตานี (โคกโพธิ์)','ยะลา','ธนบุรี','มักกะสัน','ลาดกระบัง','บ้านโป่ง','ชะอำ','ไชยา','ร่อนพิบูลย์'];

const FERRY = { a: 'มหาชัย|สมุทรสาคร', b: 'บ้านแหลม|สมุทรสาคร', th: 'ข้ามแม่น้ำท่าจีนด้วยเรือ', en: 'Ferry across the Tha Chin River' };

const ROUTES = [
{ id: 'R1', th: 'กรุงเทพ–ชุมทางบ้านภาชี (ทางร่วม)', en: 'Bangkok–Ban Phachi Jn (shared)', lines: ['N','NE'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { start: [0,0], segs: [['N']] }, data: `
@กรุงเทพมหานคร
กรุงเทพ;Bangkok (Hua Lamphong);X;0
ยมราช;Yommarat;H;2.17
หอประแจจิตรลดา;Chitralada;X;3.29
โรงพยาบาลรามาธิบดี;Ramathibodi Hospital;H;3.3
สามเสน;Sam Sen;S;4.8
ประดิพัทธ์;Pradiphat;H;6.37
ชุมทางบางซื่อ;Bang Sue Jn;S;7.47
กรุงเทพอภิวัฒน์;Krung Thep Aphiwat;S;7.82
นิคมรถไฟ กม.11;Nikhom Rot Fai Km 11;H;11.01
บางเขน;Bang Khen;S;13
ทุ่งสองห้อง;Thung Song Hong;H;14.81
หลักสี่;Lak Si;S;17.57
การเคหะ กม.19;Kan Kheha Km 19;H;19.47
ตลาดใหม่ดอนเมือง;Talat Mai Don Mueang;H;21.69
ดอนเมือง;Don Mueang;S;22.21
แกรนด์ คาแนล;Grand Canal;H;24.78
@ปทุมธานี
หลักหก;Lak Hok;H;27.61
คลองรังสิต;Khlong Rangsit;H;28.48
รังสิต;Rangsit;S;29.75
คลองหนึ่ง;Khlong Nueng;H;33.84
เชียงราก;Chiang Rak;S;37.47
มหาวิทยาลัยธรรมศาสตร์;Thammasat University;H;40.19
นวนคร;Nava Nakorn;H;44.12
@พระนครศรีอยุธยา
เชียงรากน้อย;Chiang Rak Noi;S;46.01
คลองพุทรา;Khlong Phutsa;S;51.88
บางปะอิน;Bang Pa-in;S;58
บ้านโพ;Ban Pho;S;62.75
อยุธยา;Ayutthaya;S;71.08
บ้านม้า;Ban Ma;S;74.69
มาบพระจันทร์;Map Phra Chan;S;78.98
บ้านดอนกลาง;Ban Don Klang;H;82.31
พระแก้ว;Phra Kaeo;S;85.44
ชุมทางบ้านภาชี;Ban Phachi Jn;S;89.95` },

{ id: 'R2', th: 'ชุมทางบ้านภาชี–เชียงใหม่', en: 'Ban Phachi Jn–Chiang Mai', lines: ['N'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['N', 444], ['NW', 108.5], ['NW']] }, data: `
@พระนครศรีอยุธยา
ชุมทางบ้านภาชี;Ban Phachi Jn;S;89.95
ดอนหญ้านาง;Don Ya Nang;H;93.58
หนองวิวัฒน์;Nong Wiwat;S;96.44
บ้านปลักแรด;Ban Plak Raet;H;99.16
ท่าเรือ;Tha Ruea;S;102.73
@สระบุรี
บ้านหมอ;Ban Mo;S;108.78
หนองโดน;Nong Don;S;116.56
บ้านกลับ;Ban Klap;S;121.72
@ลพบุรี
บ้านป่าหวาย;Ban Pa Wai;S;127.44
ลพบุรี;Lopburi;S;132.81
ท่าแค;Tha Khae;S;137.51
โคกกะเทียม;Khok Kathiam;S;144.23
หนองเต่า;Nong Tao;S;150.08
หนองทรายขาว;Nong Sai Khao;S;154.93
บ้านหมี่;Ban Mi;S;161.22
ห้วยแก้ว;Huai Kaeo;S;165.94
ไผ่ใหญ่;Phai Yai;H;170.33
@นครสวรรค์
โรงเรียนจันเสน;Chansen School;H;172.9
จันเสน;Chansen;S;173.86
บ้านกกกว้าว;Ban Kok Kwao;H;176.63
ช่องแค;Chong Khae;S;180.2
ทะเลหว้า;Thale Wa;H;187.37
โพนทอง;Phon Thong;S;188.65
บ้านตาคลี;Ban Takhli;S;193.02
ดงมะกุ;Dong Maku;S;198.8
หัวหวาย;Hua Wai;S;204.06
หนองโพ;Nong Pho;S;211.44
หัวงิ้ว;Hua Ngio;S;217.22
บ้านหนองหมู;Ban Nong Mu;S;221.77
เนินมะกอก;Noen Makok;S;224.81
ทุ่งน้ำซึม;Thung Nam Suem;S;231.35
เขาทอง;Khao Thong;S;235.49
นครสวรรค์;Nakhon Sawan;S;245.78
ปากน้ำโพ;Pak Nam Pho;S;250.56
บึงบอระเพ็ด;Bueng Boraphet;S;257.15
ทับกฤช;Thap Krit;S;263.68
คลองปลากด;Khlong Pla Kot;S;270.87
ชุมแสง;Chum Saeng;S;280.29
@พิจิตร
วังกร่าง;Wang Krang;S;290.24
บางมูลนาก;Bang Mun Nak;S;297.03
หอไกร;Ho Krai;S;303.5
ดงตะขบ;Dong Takhop;S;309.87
ตะพานหิน;Taphan Hin;S;319
ห้วยเกตุ;Huai Ket;S;324.91
หัวดง;Hua Dong;S;332.6
วังกรด;Wang Krot;S;339.36
พิจิตร;Phichit;S;346.79
ท่าฬ่อ;Tha Lo;S;354.26
@พิษณุโลก
บางกระทุ่ม;Bang Krathum;S;362.22
แม่เทียบ;Mae Thiap;S;366.21
บ้านใหม่;Ban Mai;S;375.31
บึงพระ;Bueng Phra;S;381.87
พิษณุโลก;Phitsanulok;S;389.28
บ้านเต็งหนาม;Ban Teng Nam;S;393.75
บ้านตูม;Ban Tum;S;400
แควน้อย;Khwae Noi;S;405.31
พรหมพิราม;Phrom Phiram;S;414.5
หนองตม;Nong Tom;S;423.2
บ้านบุ่ง;Ban Bung;S;432.75
@อุตรดิตถ์
บ้านโขน;Ban Khon;S;437.41
พิชัย;Phichai;S;447.55
ไร่อ้อย;Rai Oi;S;453.98
ชุมทางบ้านดารา;Ban Dara Jn;S;458.31
ท่าสัก;Tha Sak;S;461.8
ตรอน;Tron;S;469.86
วังกะพี้;Wang Kaphi;S;476.82
อุตรดิตถ์;Uttaradit;S;485.17
ศิลาอาสน์;Sila At;S;487.52
ท่าเสา;Tha Sao;H;489.35
บ้านด่าน;Ban Dan;S;497.56
ปางต้นผึ้ง;Pang Ton Phueng;S;509.36
@แพร่
เขาพลึง;Khao Phlueng;H;517.02
ห้วยไร่;Huai Rai;S;521.48
ไร่เกล็ดดาว;Rai Klet Dao;H;525.6
แม่พวก;Mae Phuak;H;528.22
เด่นชัย;Den Chai;S;533.94
ปากปาน;Pak Pan;S;538.43
แก่งหลวง;Kaeng Luang;S;546.94
ห้วยแม่ต้า;Huai Mae Ta;H;554.42
บ้านปิน;Ban Pin;S;563.86
ผาคัน;Pha Khan;S;578.46
ผาคอ;Pha Kho;H;581.22
@ลำปาง
ปางป๋วย;Pang Puai;S;591.07
แม่จาง;Mae Chang;S;600.33
แม่เมาะ;Mae Mo;S;609.16
ห้วยรากไม้;Huai Rak Mai;H;614.15
ศาลาผาลาด;Sala Pha Lat;S;622.2
แม่ทะ;Mae Tha;S;628.45
หนองวัวเฒ่า;Nong Wua Thao;S;637.41
นครลำปาง;Nakhon Lampang;S;642.29
บ่อแฮ้ว;Bo Haeo;S;647.11
ห้างฉัตร;Hang Chat;S;654.85
ปางม่วง;Pang Muang;S;660.98
ห้วยเรียน;Huai Rian;H;665.09
แม่ตานน้อย;Mae Tan Noi;S;671.8
@ลำพูน
ขุนตาน;Khun Tan;S;683.14
ทาชมภู;Tha Chomphu;S;691.89
ศาลาแม่ทา;Sala Mae Tha;S;700.68
หนองหล่ม;Nong Lom;S;713.01
ลำพูน;Lamphun;S;729.21
ป่าเส้า;Pa Sao;S;734.64
@เชียงใหม่
สารภี;Saraphi;S;742.78
เชียงใหม่;Chiang Mai;S;751.42` },

{ id: 'R3', th: 'ชุมทางบ้านดารา–สวรรคโลก', en: 'Ban Dara Jn–Sawankhalok', lines: ['N'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['W']] }, data: `
@อุตรดิตถ์
ชุมทางบ้านดารา;Ban Dara Jn;S;458.31
คลองละมุง;Khlong Lamung;H;466.32
@สุโขทัย
คลองมะพลับ;Khlong Maphlap;S;470.27
วัดคลองปู;Wat Khlong Pu;H;474.96
คลองยาง;Khlong Yang;H;479.03
หนองเรียง;Nong Riang;H;483.08
สวรรคโลก;Sawankhalok;S;487.14` },

{ id: 'R4', th: 'ชุมทางบ้านภาชี–อุบลราชธานี', en: 'Ban Phachi Jn–Ubon Ratchathani', lines: ['NE'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['E']] }, data: `
@พระนครศรีอยุธยา
ชุมทางบ้านภาชี;Ban Phachi Jn;S;89.95
หนองกวย;Nong Kuai;S;94.62
@สระบุรี
หนองแซง;Nong Saeng;S;98.04
หนองสีดา;Nong Sida;S;103.34
บ้านป๊อกแป๊ก;Ban Pok Paek;S;107.15
สระบุรี;Saraburi;S;113.26
หนองบัว;Nong Bua;S;119.24
ชุมทางแก่งคอย;Kaeng Khoi Jn;S;125.1
ทับกวาง;Thap Kwang;H;131.24
มาบกะเบา;Map Kabao;S;134.3
ผาเสด็จ;Pha Sadet;S;138.95
หินลับ;Hin Lap;S;144.29
มวกเหล็ก;Muak Lek;S;152.3
@นครราชสีมา
กลางดง;Klang Dong;S;160.03
ปางอโศก;Pang Asok;S;165.19
บันไดม้า;Bandai Ma;S;173.64
ปากช่อง;Pak Chong;S;179.93
ซับม่วง;Sap Muang;S;187.89
จันทึก;Chanthuek;S;195.5
คลองขนานจิตร;Khlong Khanan Chit;S;202.2
คลองไผ่;Khlong Phai;S;206.21
ลาดบัวขาว;Lat Bua Khao;S;209.41
บ้านใหม่สำโรง;Ban Mai Samrong;S;214.9
หนองน้ำขุ่น;Nong Nam Khun;S;218.27
สีคิ้ว;Sikhio;S;223.79
โคกสะอาด;Khok Sa-at;S;228.99
สูงเนิน;Sung Noen;S;233.87
กุดจิก;Kut Chik;S;241.15
โคกกรวด;Khok Kruat;S;249.94
ภูเขาลาด;Phu Khao Lat;S;257.44
นครราชสีมา;Nakhon Ratchasima;S;263.65
ชุมทางถนนจิระ;Thanon Chira Jn;S;266.28
บ้านพะเนา;Ban Phanao;S;276.35
บ้านพระพุทธ;Ban Phra Phut;H;280.1
ท่าช้าง;Tha Chang;S;285.4
หนองมโนรมย์;Nong Manorom;S;293.26
จักราช;Chakkarat;S;300.15
บ้านหินโคน;Ban Hin Khon;S;309.75
หินดาษ;Hin Dat;S;316.9
ห้วยแถลง;Huai Thalaeng;S;325.65
หนองกะทิง;Nong Kathing;S;337.5
@บุรีรัมย์
ลำปลายมาศ;Lam Plai Mat;S;345.7
ทะเมนชัย;Thamen Chai;S;354.85
บ้านแสลงพัน;Ban Salaeng Phan;S;363.3
บ้านหนองตาด;Ban Nong Tat;S;366.5
บุรีรัมย์;Buriram;S;376.02
บ้านตะโก;Ban Tako;H;380.35
ห้วยราช;Huai Rat;S;385.51
กระสัง;Krasang;S;398.65
หนองเต็ง;Nong Teng;S;405.5
@สุรินทร์
ลำชี;Lam Chi;S;412
สุรินทร์;Surin;S;419.75
บุฤาษี;Bu Ruesi;S;428.6
เมืองที;Mueang Thi;S;437.16
กะโดนค้อ;Kadon Kho;S;445.5
ศรีขรภูมิ;Sikhoraphum;H;452.39
บ้านกะลัน;Ban Kalan;S;460.25
สำโรงทาบ;Samrong Thap;S;471
@ศรีสะเกษ
ห้วยทับทัน;Huai Thap Than;S;481.5
หนองแคน;Nong Khaen;H;489.04
อุทุมพรพิสัย;Uthumphon Phisai;S;494.45
บ้านแต้;Ban Tae;H;498.27
บ้านเนียม;Ban Niam;S;504
ศรีสะเกษ;Sisaket;S;515.09
เฉลิมกาญจนา;Chaloem Kanchana;H;516.09
หนองแวง;Nong Waeng;S;527.19
บ้านคล้อ;Ban Khlo;S;534.2
กันทรารมย์;Kanthararom;S;542.18
บ้านโนนผึ้ง;Ban Non Phueng;H;546.86
@อุบลราชธานี
ห้วยขยุง;Huai Khayung;S;553.99
บ้านถ่อน;Ban Thon;H;557.7
บุ่งหวาย;Bung Wai;S;566.2
อุบลราชธานี;Ubon Ratchathani;S;575.1` },

{ id: 'R5', th: 'ชุมทางถนนจิระ–หนองคาย', en: 'Thanon Chira Jn–Nong Khai', lines: ['NE'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['N']] }, data: `
@นครราชสีมา
ชุมทางถนนจิระ;Thanon Chira Jn;S;266.28
บ้านเกาะ;Ban Ko;S;272.5
หนองไข่น้ำ;Nong Khai Nam;S;282.92
บ้านกระโดน;Ban Kradon;S;284.67
บ้านหนองกันงา;Ban Nong Kan Nga;S;288.12
หนองแมว;Nong Maeo;S;289.79
โนนสูง;Non Sung;S;295.08
บ้านดงพลอง;Ban Dong Phlong;S;302.19
บ้านมะค่า;Ban Makha;S;308.2
เนินถั่วแปบ;Noen Thua Paep;H;311.38
พลสงคราม;Phon Songkhram;S;315.65
บ้านดอนใหญ่;Ban Don Yai;S;320.35
เมืองคง;Mueang Khong;S;326.8
บ้านไร่;Ban Rai;S;333.67
โนนทองหลาง;Non Thonglang;S;335.71
ห้วยระหัด;Huai Rahat;S;342.5
ชุมทางบัวใหญ่;Bua Yai Jn;S;345.5
เนินสวัสดิ์;Noen Sawat;H;351.5
หนองบัวลาย;Nong Bua Lai;S;357.36
ศาลาดิน;Sala Din;H;362.43
@ขอนแก่น
หนองมะเขือ;Nong Makhuea;S;370.04
เมืองพล;Mueang Phon;S;377.66
บ้านหัน;Ban Han;S;396.82
บ้านไผ่;Ban Phai;S;407.72
บ้านแฮด;Ban Haet;S;423.6
หนองเม็ก;Nong Mek;H;431.59
ท่าพระ;Tha Phra;S;439.81
กุดกว้าง;Kut Kwang;S;444.08
ขอนแก่น;Khon Kaen;S;449.75
สำราญ;Samran;S;460.71
โนนพยอม;Non Phayom;S;474.93
บ้านวังชัย;Ban Wang Chai;H;480.45
น้ำพอง;Nam Phong;S;484.21
ห้วยเสียว;Huai Siao;S;489.95
เขาสวนกวาง;Khao Suan Kwang;S;500.51
@อุดรธานี
โนนสะอาด;Non Sa-at;S;514.45
ห้วยเกิ้ง;Huai Koeng;S;523.4
กุมภวาปี;Kumphawapi;S;532.5
ห้วยสามพาด;Huai Sam Phat;S;542.75
หนองตะไก้;Nong Takai;S;550.65
คำกลิ้ง;Kham Kling;H;562.05
หนองขอนขวาง;Nong Khon Khwang;S;565.4
อุดรธานี;Udon Thani;S;568.84
หนองตูม;Nong Tum;H;575.75
นาพู่;Na Phu;S;580
@หนองคาย
คอกช้าง;Khok Chang;H;598.1
หนองบัวเงิน;Nong Bua Ngoen;H;602
นาทา;Na Tha;S;617.84
หนองคาย;Nong Khai;S;621.1` },

{ id: 'R6', th: 'ชุมทางแก่งคอย–ชุมทางบัวใหญ่ (ทางลำนารายณ์)', en: 'Kaeng Khoi Jn–Bua Yai Jn (via Lam Narai)', lines: ['NE'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { connect: 'diag' }, data: `
@สระบุรี
ชุมทางแก่งคอย;Kaeng Khoi Jn;S;125.1
บ้านช่องใต้;Ban Chong Tai;S;128.8
เขาคอก;Khao Khok;H;134.37
เขาหินดาษ;Khao Hin Dat;H;141.85
หินซ้อน;Hin Son;S;147.9
เขาสูง;Khao Sung;H;152.3
แก่งเสือเต้น;Kaeng Suea Ten;S;159.65
@ลพบุรี
เขื่อนป่าสักชลสิทธิ์;Pa Sak Jolasid Dam;H;162.38
บ้านหนองบัว;Ban Nong Bua;H;165.96
โคกสลุง;Khok Salung;S;176.55
สุรนารายณ์;Suranarai;S;185.8
เขายายกะตา;Khao Yai Kata;H;198.95
โรงเรียนอัสสัมชัญคอนแวนต์;Assumption Convent School;H;203.65
ตลาดลำนารายณ์;Talat Lam Narai;H;207.38
ลำนารายณ์;Lam Narai;S;208.8
บ้านเกาะรัง;Ban Ko Rang;H;220.35
แผ่นดินทอง;Phaendin Thong;S;226.45
บ้านจงโก;Ban Chong Ko;H;236.65
โคกคลี;Khok Khli;S;240.87
@ชัยภูมิ
ช่องสำราญ;Chong Samran;S;250.64
บ้านวะตะแบก(เทพสถิตย์);Ban Wa Tabaek (Thep Sathit);S;263.14
ห้วยยายจิ่ว;Huai Yai Chio;S;273.13
บ้านปากจาบ;Ban Pak Chap;H;279.97
บำเหน็จณรงค์;Bamnet Narong;S;290.53
บ้านกลอย;Ban Kloi;H;293.25
วังกะอาม;Wang Ka-am;H;297.3
โนนคร้อ;Non Khro;H;302.1
จัตุรัส;Chatturat;S;310.19
หนองฉิม;Nong Chim;S;322.85
บ้านตาเนิน;Ban Ta Noen;H;330.15
บ้านหนองขาม;Ban Nong Kham;H;334.05
@นครราชสีมา
บ้านเหลื่อม;Ban Lueam;S;341.18
บ้านโคกกระเบื้อง;Ban Khok Krabueang;H;346.16
บ้านหนองปรือโป่ง;Ban Nong Prue Pong;H;351.83
หนองพลวง;Nong Phluang;S;355.19
บ้านกระพี้;Ban Kraphi;H;358.2
บ้านเก่างิ้ว;Ban Kao Ngio;H;360.17
บ้านสระครก;Ban Sa Khrok;H;362.14
บ้านโสกรัง;Ban Sok Rang;H;366.5
ชุมทางบัวใหญ่;Bua Yai Jn;S;375.9` },

{ id: 'R7', th: 'กรุงเทพ–อรัญประเทศ / บ้านคลองลึก', en: 'Bangkok–Aranyaprathet / Ban Khlong Luek', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['E']] }, data: `
@กรุงเทพมหานคร
กรุงเทพ;Bangkok (Hua Lamphong);X;0
อุรุพงษ์;Urupong;H;2.64
พญาไท;Phaya Thai;H;3.67
ราชปรารภ;Ratchaprarop;H;4.59
มักกะสัน;Makkasan;S;5.17
อโศก;Asok;H;6.98
คลองตัน;Khlong Tan;S;9.85
สุขุมวิท 71;Sukhumvit 71;H;11.14
หัวหมาก;Hua Mak;S;15.18
บ้านทับช้าง;Ban Thap Chang;S;20.87
ซอยวัดลานบุญ;Soi Wat Lan Bun;H;23.94
ลาดกระบัง;Lat Krabang;S;26.75
พระจอมเกล้า;Phra Chom Klao;H;30.33
หัวตะเข้;Hua Takhe;S;30.91
คลองหลวงแพ่ง;Khlong Luang Phaeng;S;39.5
@ฉะเชิงเทรา
คลองอุดมชลจร;Khlong Udom Chonlachon;H;43.43
เปรง;Preng;S;46.5
คลองแขวงกลั่น;Khlong Khwaeng Klan;H;51.02
คลองบางพระ;Khlong Bang Phra;S;53.99
บางเตย;Bang Toei;H;57.1
ชุมทางฉะเชิงเทรา;Chachoengsao Jn;S;60.99
บางขวัญ;Bang Khwan;H;67.14
โพรงอากาศ;Phrong Akat;H;74.53
บางน้ำเปรี้ยว;Bang Nam Priao;S;79.04
ชุมทางคลองสิบเก้า;Khlong Sip Kao Jn;S;85.6
คลองยี่สิบเอ็ด;Khlong Yi Sip Et;H;89.42
โยทะกา;Yothaka;S;93.73
@ปราจีนบุรี
บ้านสร้าง;Ban Sang;S;101.53
หนองน้ำขาว;Nong Nam Khao;H;109.49
@นครนายก
บ้านปากพลี;Ban Pak Phli;S;115.28
@ปราจีนบุรี
ปราจีนบุรี;Prachinburi;S;121.78
หนองกระจับ;Nong Krachap;H;126.25
โคกมะกอก;Khok Makok;S;131
ประจันตคาม;Prachantakham;S;137.65
หนองแสง;Nong Saeng;H;143.41
บ้านดงบัง;Ban Dong Bang;S;146.73
หนองศรีวิชัย;Nong Si Wichai;H;148.41
บ้านพรมแสง;Ban Phrom Saeng;H;151.85
บ้านเกาะแดง;Ban Ko Daeng;H;156.15
กบินทร์บุรี;Kabin Buri;S;161.26
กบินทร์เก่า;Kabin Kao;H;165.65
หนองสัง;Nong Sang;S;172.71
พระปรง;Phra Prong;H;183.76
@สระแก้ว
บ้านแก้ง;Ban Kaeng;H;190.06
ศาลาลำดวน;Sala Lamduan;H;195.87
สระแก้ว;Sa Kaeo;S;202.25
ศูนย์ราชการสระแก้ว;Sa Kaeo Government Center;S;212.94
ท่าเกษม;Tha Kasem;H;216.28
ห้วยโจด;Huai Chot;H;223.4
วัฒนานคร;Watthana Nakhon;S;233.86
บ้านโป่งคอม;Ban Pong Khom;H;240.32
ห้วยเดื่อ;Huai Duea;H;245.03
อรัญประเทศ;Aranyaprathet;S;254.5
พรมแดนบ้านคลองลึก;Ban Khlong Luek Border;S;260.28` },

{ id: 'R8', th: 'ชุมทางฉะเชิงเทรา–ท่าเรือพาณิชย์สัตหีบ', en: 'Chachoengsao Jn–Sattahip Port', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['S']] }, data: `
@ฉะเชิงเทรา
ชุมทางฉะเชิงเทรา;Chachoengsao Jn;S;60.99
แปดริ้ว;Paet Rio;H;62.87
ดอนสีนนท์;Don Si Non;S;75.97
@ชลบุรี
พานทอง;Phan Thong;S;91.53
ชลบุรี;Chonburi;S;107.79
แสนสุข;Saen Suk;H;114.46
บางพระ;Bang Phra;S;121.31
เขาพระบาท;Khao Phra Bat;S;125.35
ชุมทางศรีราชา;Si Racha Jn;S;130.6
บางละมุง;Bang Lamung;S;144.08
พัทยา;Pattaya;S;155.14
พัทยาใต้;Pattaya Tai;H;158.82
ตลาดน้ำสี่ภาค พัทยา;Pattaya Floating Market;H;163
บ้านห้วยขวาง;Ban Huai Khwang;S;168.34
ญาณสังวราราม;Yannasangwararam;S;171.1
สวนนงนุช;Nong Nooch Garden;H;174.09
ชุมทางเขาชีจรรย์;Khao Chi Chan Jn;S;180
บ้านพลูตาหลวง;Ban Phlu Ta Luang;S;184.03
แจมโบรี;Jamboree;H;193.03
ท่าเรือพาณิชย์สัตหีบ;Sattahip Commercial Port;S;195.5` },

{ id: 'R9', th: 'ชุมทางศรีราชา–ท่าเรือแหลมฉบัง', en: 'Si Racha Jn–Laem Chabang Port', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['W']] }, data: `
@ชลบุรี
ชุมทางศรีราชา;Si Racha Jn;S;130.6
แหลมฉบัง;Laem Chabang;S;139.85` },

{ id: 'R10', th: 'ชุมทางเขาชีจรรย์–มาบตาพุด', en: 'Khao Chi Chan Jn–Map Ta Phut', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['E']] }, data: `
@ชลบุรี
ชุมทางเขาชีจรรย์;Khao Chi Chan Jn;S;180
@ระยอง
บ้านฉาง;Ban Chang;S;192.25
มาบตาพุด;Map Ta Phut;S;200.48` },

{ id: 'R11', th: 'ชุมทางคลองสิบเก้า–ชุมทางแก่งคอย', en: 'Khlong Sip Kao Jn–Kaeng Khoi Jn', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง) ตามหลัก กม. สายตะวันออก',
  geom: { connect: 'straight' }, data: `
@ฉะเชิงเทรา
ชุมทางคลองสิบเก้า;Khlong Sip Kao Jn;S;85.6
@นครนายก
องครักษ์;Ongkharak;S;115
@สระบุรี
วิหารแดง;Wihan Daeng;H;138.4
บุใหญ่;Bu Yai;H;149
ชุมทางแก่งคอย;Kaeng Khoi Jn;H;166.89` },

{ id: 'R12', th: 'มักกะสัน–แม่น้ำ', en: 'Makkasan–Mae Nam', lines: ['E'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { segs: [['S']] }, data: `
@กรุงเทพมหานคร
มักกะสัน;Makkasan;S;5.17
แม่น้ำ;Mae Nam;S;9.87
ท่าเรือใหม่;Tha Ruea Mai;H;14
โรงกลั่นน้ำมันบางจาก;Bangchak Refinery;F;22` },

{ id: 'R13', th: 'กรุงเทพอภิวัฒน์–ชุมทางตลิ่งชัน (ทางเชื่อมสายใต้)', en: 'Krung Thep Aphiwat–Taling Chan Jn (Southern link)', lines: ['S'], base: 'กรุงเทพ (หัวลำโพง)',
  geom: { connect: 'straight' }, data: `
@กรุงเทพมหานคร
กรุงเทพอภิวัฒน์;Krung Thep Aphiwat;S;7.82
สทล.10+375;Halt Km 10+375;H;10.37
บางซ่อน;Bang Son;H;12.9
บางบำหรุ;Bang Bamru;S;17.94
ชุมทางตลิ่งชัน;Taling Chan Jn;S;22.13` },

{ id: 'R14', th: 'ธนบุรี–ชุมทางหนองปลาดุก (ทางร่วม)', en: 'Thon Buri–Nong Pla Duk Jn (shared)', lines: ['W','S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { start: [-10,0], segs: [['N', 5.21], ['W']] }, data: `
@กรุงเทพมหานคร
ธนบุรี;Thon Buri;S;0
จรัลสนิทวงศ์;Charan Sanitwong;H;0.67
บางระมาด;Bang Ramat;H;3.42
ชุมทางตลิ่งชัน;Taling Chan Jn;S;5.21
บ้านฉิมพลี;Ban Chimphli;H;7.77
พุทธมณฑล สาย 2;Phutthamonthon Sai 2;H;10.6
ศาลาธรรมสพน์;Sala Thammasop;S;13.18
@นครปฐม
ศาลายา;Salaya;S;18.19
วัดสุวรรณ;Wat Suwan;S;23.46
คลองมหาสวัสดิ์;Khlong Maha Sawat;H;27.05
วัดงิ้วราย;Wat Ngio Rai;S;30.8
นครชัยศรี;Nakhon Chai Si;S;35.13
ท่าแฉลบ;Tha Chalaep;S;40.02
ต้นสำโรง;Ton Samrong;S;44.3
นครปฐม;Nakhon Pathom;S;48.12
พระราชวังสนามจันทร์;Sanam Chan Palace;H;50.13
โพรงมะเดื่อ;Phrong Maduea;S;55.36
@ราชบุรี
คลองบางตาล;Khlong Bang Tan;S;58.97
ชุมทางหนองปลาดุก;Nong Pla Duk Jn;S;64.19` },

{ id: 'R15', th: 'ชุมทางหนองปลาดุก–สุพรรณบุรี', en: 'Nong Pla Duk Jn–Suphanburi', lines: ['W'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['N']] }, data: `
@ราชบุรี
ชุมทางหนองปลาดุก;Nong Pla Duk Jn;S;64.19
@นครปฐม
ยางปราสาท;Yang Prasat;H;71.6
ดอนขุนวิเศษ;Don Khun Wiset;H;80.5
กำแพงแสน;Kamphaeng Saen;H;85.3
ทุ่งบัว;Thung Bua;H;87.86
หนองฟัก;Nong Fak;H;93
โรงเรียนการบิน;Flying Training School;H;96.46
@สุพรรณบุรี
หนองวัลย์เปรียง;Nong Wan Priang;H;104.97
ศรีสำราญ;Si Samran;H;113.3
ดอนสงวน;Don Sanguan;H;118.97
ดอนทอง;Don Thong;H;122.31
หนองผักชี;Nong Phak Chi;H;125.5
บ้านมะขามล้ม;Ban Makham Lom;H;131.35
สะแกย่างหมู;Sakae Yang Mu;H;135.35
สุพรรณบุรี;Suphanburi;S;141.6
มาลัยแมน;Malai Maen;H;142.66` },

{ id: 'R16', th: 'ชุมทางหนองปลาดุก–น้ำตก', en: 'Nong Pla Duk Jn–Nam Tok', lines: ['W'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['NW']] }, data: `
@ราชบุรี
ชุมทางหนองปลาดุก;Nong Pla Duk Jn;S;64.19
ถนนทรงพล;Thanon Songphon;H;67.9
สระโกสินารายณ์;Sa Kosinarai;S;73.65
@กาญจนบุรี
ลูกแก;Luk Kae;S;77.43
ท่าเรือน้อย;Tha Ruea Noi;S;89.77
บ้านหนองเสือ;Ban Nong Suea;H;96.68
ท่าม่วง;Tha Muang;H;100.02
ทุ่งทอง;Thung Thong;H;102.71
ปากแพรก;Pak Phraek;H;114.36
กาญจนบุรี;Kanchanaburi;S;117.04
สะพานแควใหญ่;River Kwai Bridge;H;120.26
เขาปูน;Khao Pun;H;121.55
วิทยาลัยเกษตร;Agricultural College;H;129.69
วังลาน;Wang Lan;H;132.7
นากาญจน์;Na Kan;H;136.46
วังเย็น;Wang Yen;S;140.15
วังตะเคียน;Wang Takhian;H;144.8
บ้านโป่งเสี้ยว;Ban Pong Siao;H;148.17
บ้านเก่า;Ban Kao;H;151.95
ท่าตาเสือ;Tha Ta Suea;H;156.8
ท่ากิเลน;Tha Kilen;S;161.95
วัดสิงห์;Wat Sing;H;167.03
ลุ่มสุ่ม;Lum Sum;H;172.35
สะพานถ้ำกระแซ;Tham Krasae Bridge;H;173.87
วัดโพธิ์;Wat Pho;S;178.1
เกาะมหามงคล;Ko Maha Mongkhon;H;183.66
ช่องแคบ;Chong Khaep;H;185.35
วังใหญ่;Wang Yai;H;188.9
บ้านพุพง;Ban Phu Phong;H;191.25
น้ำตก;Nam Tok;S;194.24
น้ำตกไทรโยคน้อย;Nam Tok Sai Yok Noi;X;195.63` },

{ id: 'R17', th: 'วงเวียนใหญ่–มหาชัย', en: 'Wongwian Yai–Mahachai', lines: ['MK'], base: 'วงเวียนใหญ่',
  geom: { start: [-6,9], segs: [['SW']] }, data: `
@กรุงเทพมหานคร
วงเวียนใหญ่;Wongwian Yai;S;0
ตลาดพลู;Talat Phlu;S;1.78
คลองต้นไทร;Khlong Ton Sai;H;3.35
จอมทอง;Chom Thong;H;4.13
วัดไทร;Wat Sai;H;5.76
วัดสิงห์;Wat Sing;S;7.15
บางบอน;Bang Bon;H;9.76
การเคหะธนบุรี;Kan Kheha Thon Buri;H;10.23
รางสะแก;Rang Sakae;H;10.53
รางโพธิ์;Rang Pho;S;14.25
สามแยก;Sam Yaek;H;15.83
@สมุทรสาคร
พรมแดน;Phrom Daen;H;17.29
ทุ่งสีทอง;Thung Si Thong;H;18.76
บางน้ำจืด;Bang Nam Chuet;H;19.97
คอกควาย;Khok Khwai;H;22.99
บ้านขอม;Ban Khom;H;26.76
คลองจาก;Khlong Chak;H;29.76
มหาชัย;Mahachai;S;31.22` },

{ id: 'R18', th: 'บ้านแหลม–แม่กลอง', en: 'Ban Laem–Maeklong', lines: ['MK'], base: 'บ้านแหลม',
  geom: { start: [-31.5,33], segs: [['W', 6], ['SW']] }, data: `
@สมุทรสาคร
บ้านแหลม;Ban Laem;S;0.18
ท่าฉลอม;Tha Chalom;H;1.24
บ้านชีผ้าขาว;Ban Chi Pha Khao;H;3.89
คลองนกเล็ก;Khlong Nok Lek;H;5.95
บางสีคต;Bang Si Khot;H;6.9
บางกระเจ้า;Bang Krachao;H;8.86
บ้านบ่อ;Ban Bo;H;10.9
บางโทรัด;Bang Thorat;H;13.32
บ้านกาหลง;Ban Kalong;H;15.78
บ้านนาขวาง;Ban Na Khwang;H;17.94
บ้านนาโคก;Ban Na Khok;H;19.97
@สมุทรสงคราม
เขตเมือง;Khet Mueang;H;23.73
ลาดใหญ่;Lat Yai;H;27.66
บางกระบูน;Bang Krabun;H;30.16
แม่กลอง;Maeklong;S;33.75` },

{ id: 'R20', th: 'ชุมทางหนองปลาดุก–สุไหงโก-ลก', en: 'Nong Pla Duk Jn–Sungai Kolok', lines: ['S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['S', 864.39], ['SE']] }, data: `
@ราชบุรี
ชุมทางหนองปลาดุก;Nong Pla Duk Jn;S;64.19
บ้านโป่ง;Ban Pong;S;68.22
นครชุมน์;Nakhon Chum;S;73.69
คลองตาคด;Khlong Ta Khot;S;77.29
โพธาราม;Photharam;S;81.8
เจ็ดเสมียน;Chet Samian;S;88.87
บ้านกล้วย;Ban Kluai;S;94.64
สะพานจุฬาลงกรณ์;Chulalongkorn Bridge;H;100.29
ราชบุรี;Ratchaburi;S;101.31
บ้านคูบัว;Ban Khu Bua;S;105.46
บ่อตะคร้อ;Bo Takhro;S;111.2
บ้านป่าไก่;Ban Pa Kai;S;114.5
ปากท่อ;Pak Tho;S;118.62
ห้วยโรง;Huai Rong;H;122.77
@สมุทรสงคราม
บางเค็ม;Bang Khem;S;127.18
@เพชรบุรี
เขาย้อย;Khao Yoi;S;133.77
หนองปลาไหล;Nong Pla Lai;S;139.44
บางจาก;Bang Chak;S;143.9
เพชรบุรี;Phetchaburi;S;150.49
เขาทโมน;Khao Thamon;S;160.32
หนองไม้เหลือง;Nong Mai Lueang;S;164.21
หนองจอก;Nong Chok;S;169.9
หนองศาลา;Nong Sala;S;175.4
ชะอำ;Cha-am;S;187.06
ห้วยทรายเหนือ;Huai Sai Nuea;S;197.86
ห้วยทรายใต้;Huai Sai Tai;S;201.64
@ประจวบคีรีขันธ์
หัวหิน;Hua Hin;S;212.99
หนองแก;Nong Kae;S;216.96
สวนสนประดิพัทธ์;Suan Son Pradiphat;H;221.03
เขาเต่า;Khao Tao;S;225.04
วังก์พง;Wang Phong;S;232.92
ปราณบุรี;Pran Buri;S;235.86
ห้วยขวาง;Huai Khwang;H;241.93
หนองคาง;Nong Khang;S;246.94
สามร้อยยอด;Sam Roi Yot;S;254.99
สามกระทาย;Sam Krathai;S;261.15
กุยบุรี;Kui Buri;S;271.33
บ่อนอก;Bo Nok;S;278.85
มุ่งมะเม่า;Mung Mamao;S;288.88
คั่นกระได;Khan Kradai;S;294.76
ประจวบคีรีขันธ์;Prachuap Khiri Khan;S;302.33
หนองหิน;Nong Hin;S;310.37
หว้ากอ;Wa Ko;H;313.42
วังด้วน;Wang Duan;S;318.22
ห้วยยาง;Huai Yang;S;329.07
ทุ่งประดู่;Thung Pradu;S;338.6
ทับสะแก;Thap Sakae;S;342.06
ดอนทราย;Don Sai;S;347
โคกตาหอม;Khok Ta Hom;H;353.04
บ้านกรูด;Ban Krut;S;360.53
หนองมงคล;Nong Mongkhon;H;365.85
นาผักขวง;Na Phak Khuang;S;371.04
บางสะพานใหญ่;Bang Saphan Yai;S;376.52
หินกอง;Hin Kong;H;383.58
ชะม่วง;Chamuang;S;385.92
บางสะพานน้อย;Bang Saphan Noi;S;392.66
ห้วยสัก;Huai Sak;S;399.92
บ้านทรายทอง;Ban Sai Thong;S;404.3
@ชุมพร
เขาไชยราช;Khao Chai Rat;S;409.65
มาบอำมฤต;Map Ammarit;S;420.59
บ้านทรัพย์สมบูรณ์;Ban Sap Sombun;H;427.66
คลองวังช้าง;Khlong Wang Chang;S;434.29
ปะทิว;Pathio;S;440.35
บ้านคอกม้า;Ban Khok Ma;S;447.46
สะพลี;Saphli;S;453.8
หนองเนียน;Nong Nian;H;458.38
นาชะอัง;Na Cha-ang;S;463.2
ชุมพร;Chumphon;S;468.53
แสงแดด;Saeng Daet;S;472.54
ทุ่งคา;Thung Kha;S;480.91
วิสัย;Wisai;S;489.97
บ้านครน;Ban Khron;H;495.75
สวี;Sawi;S;500.76
เขาสวนทุเรียน;Khao Suan Thurian;S;508.51
เขาปีบ;Khao Pip;H;512.02
ปากตะโก;Pak Tako;S;516.81
ท่าทอง;Tha Thong;H;522.35
ควนหินมุ้ย;Khuan Hin Mui;S;526.08
หลังสวน;Lang Suan;S;533.3
คลองขนาน;Khlong Khanan;S;541.03
หัวมาด;Hua Mat;H;546.53
ละแม;Lamae;S;553.7
บ้านดวด;Ban Duat;S;560.14
@สุราษฎร์ธานี
คันธุลี;Khan Thuli;S;566.37
ดอนธูป;Don Thup;S;570.05
ท่าชนะ;Tha Chana;S;577.78
บ้านเกาะมุกข์;Ban Ko Muk;H;584.06
เขาพนมแบก;Khao Phanom Baek;S;588.06
ไชยา;Chaiya;S;597.71
ท่าฉาง;Tha Chang;S;610.53
คลองขุด;Khlong Khut;H;614
คลองไทร;Khlong Sai;S;618.87
มะลวน;Maluan;S;623.92
ชุมทางบ้านทุ่งโพธิ์;Ban Thung Pho Jn;S;631
สุราษฎร์ธานี;Surat Thani;S;635
เขาหัวควาย;Khao Hua Khwai;S;641.51
บ่อกรัง;Bo Krang;H;647.23
เขาพลู;Khao Phlu;S;652.46
คลองยา;Khlong Ya;S;657.76
บ้านนา;Ban Na;H;662.34
ห้วยมุด;Huai Mut;S;669.68
นาสาร;Na San;H;673.7
คลองปราบ;Khlong Prap;S;679.9
พรุพี;Phru Phi;S;684.03
คลองสูญ;Khlong Sun;S;687.72
บ้านส้อง;Ban Song;H;692.73
บ้านพรุกระแชง;Ban Phru Krachaeng;S;699.78
@นครศรีธรรมราช
ห้วยปริก;Huai Prik;S;704.61
กระเบียด;Krabiat;S;709.87
ทานพอ;Than Pho;S;716.66
ฉวาง;Chawang;H;722.41
คลองจันดี;Khlong Chandi;S;727.95
พ่อท่านคล้ายวาจาสิทธิ์;Pho Than Khlai Wacha Sit;H;728.98
หลักช้าง;Lak Chang;S;734.71
คลองกุย;Khlong Kui;H;738.9
นาบอน;Na Bon;S;743.1
คลองจัง;Khlong Chang;S;747.03
บ้านเกาะปริง;Ban Ko Pring;H;751.03
ชุมทางทุ่งสง;Thung Song Jn;S;757.08
ใสใหญ่;Sai Yai;S;762
ช่องเขา;Chong Khao;S;767.79
ร่อนพิบูลย์;Ron Phibun;S;776.33
ชุมทางเขาชุมทอง;Khao Chum Thong Jn;S;781.01
ควนหนองคว้า;Khuan Nong Khwa;S;789.38
บ้านตูล;Ban Tun;S;794.94
ชะอวด;Cha-uat;S;806.06
หนองจิก;Nong Chik;H;810.69
บ้านนางหลง;Ban Nang Long;S;813.47
บ้านตรอกแค;Ban Trok Khae;S;816.35
บ้านขอนหาด;Ban Khon Hat;S;818.95
@พัทลุง
แหลมโตนด;Laem Tanot;S;824.06
บ้านสุนทรา;Ban Sunthara;H;828.03
ปากคลอง;Pak Khlong;S;833.11
บ้านมะกอกใต้;Ban Makok Tai;H;837.05
ชัยบุรี;Chai Buri;H;839.97
พัทลุง;Phatthalung;S;846.01
นาปรือ;Na Prue;H;847.07
บ้านค่ายไทย;Ban Khai Thai;H;853.19
บ้านต้นโดน;Ban Ton Don;S;856.28
บ้านห้วยแตน;Ban Huai Taen;H;859.25
เขาชัยสน;Khao Chaison;S;865.01
บางแก้ว;Bang Kaeo;S;870.17
ควนพระ;Khuan Phra;H;876.5
ควนเคี่ยม;Khuan Khiam;S;881.15
หารกง;Han Kong;S;885.35
หารเทา;Han Thao;S;888.68
วัดควนเผยอ;Wat Khuan Phayoe;S;893.49
โคกทราย;Khok Sai;S;896.24
@สงขลา
ควนเนียง;Khuan Niang;S;902.97
บ้านเกาะใหญ่;Ban Ko Yai;S;909.5
บางกล่ำ;Bang Klam;S;917.02
บ้านดินลาน;Ban Din Lan;S;921.84
ชุมทางหาดใหญ่;Hat Yai Jn;S;928.58
นาม่วง;Na Muang;S;940.26
วัดควนมีด;Wat Khuan Mit;S;953.75
จะนะ;Chana;S;964.5
ท่าแมงลัก;Tha Maenglak;S;972.1
เกาะสะบ้า;Ko Saba;S;980.79
เทพา;Thepha;S;991.99
ตาแปด;Ta Paet;S;999.91
@ปัตตานี
บ้านนิคม;Ban Nikhom;H;1003.27
ปัตตานี (โคกโพธิ์);Pattani (Khok Pho);S;1009.21
นาประดู่;Na Pradu;H;1016.73
วัดช้างไห้;Wat Chang Hai;S;1020.09
ป่าไร่;Pa Rai;H;1021.29
@ยะลา
คลองทราย;Khlong Sai;S;1026.07
ตาเซะ;Ta Se;S;1031.59
บ้านยุโป;Ban Yupo;H;1034.88
ยะลา;Yala;S;1038.75
ไม้แก่น;Mai Kaen;S;1048.8
บ้านปาแต;Ban Patae;H;1051.95
รามัน;Raman;S;1056.82
บาลอ;Balo;S;1061.7
@นราธิวาส
รือเสาะ;Rueso;S;1071.19
บ้านสโลว์บูกิ๊ตยือแร;Ban Salo Bukit Yue Rae;H;1075.98
ลาโละ;Lalo;S;1081.77
มะรือโบ;Maruebo;S;1089.46
กะแด๊;Kadae;H;1093.96
ตันหยงมัส;Tanyong Mat;S;1099.5
ป่าไผ่;Pa Phai;S;1105.45
เจาะไอร้อง;Cho-airong;S;1111.15
บูกิต;Bukit;S;1115.83
ไอสะเตีย;Ai Satia;S;1119.62
โต๊ะเต็ง;To Teng;S;1125.65
สุไหงปาดี;Sungai Padi;S;1130.1
โคกสยา;Khok Saya;H;1137.14
สุไหงโก-ลก;Sungai Kolok;S;1142.99` },

{ id: 'R21', th: 'ชุมทางบ้านทุ่งโพธิ์–คีรีรัฐนิคม', en: 'Ban Thung Pho Jn–Khiri Rat Nikhom', lines: ['S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['W']] }, data: `
@สุราษฎร์ธานี
ชุมทางบ้านทุ่งโพธิ์;Ban Thung Pho Jn;S;631
บ้านดอนรัก;Ban Don Rak;H;634.35
บ้านทุ่งหลวง;Ban Thung Luang;H;640.75
บ้านขนาย;Ban Khanai;H;644.55
บ้านดอนเรียบ;Ban Don Riap;H;649.35
คลองยัน;Khlong Yan;H;652.6
เขาหลุง;Khao Lung;H;655.58
บ้านยาง;Ban Yang;H;658
คีรีรัฐนิคม;Khiri Rat Nikhom;S;662` },

{ id: 'R22', th: 'ชุมทางทุ่งสง–กันตัง', en: 'Thung Song Jn–Kantang', lines: ['S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['SW']] }, data: `
@นครศรีธรรมราช
ชุมทางทุ่งสง;Thung Song Jn;S;757.08
ที่วัง;Thi Wang;S;765.57
บ้านปูน;Ban Pun;H;773.08
กะปาง;Kapang;H;776.33
@ตรัง
ควนเมา;Khuan Mao;H;780.97
คลองมวน;Khlong Muan;H;789.49
ยางยวน;Yang Yuan;H;795.43
ห้วยยอด;Huai Yot;S;800.82
ลำภูรา;Lam Phu Ra;H;814.51
ตรัง;Trang;S;829.28
นาป้อ;Na Po;H;832.67
พรุใหญ่;Phru Yai;H;835.86
บ้านป่ากอ;Ban Pa Ko;H;843.25
กันตัง;Kantang;S;850.08` },

{ id: 'R23', th: 'ชุมทางเขาชุมทอง–นครศรีธรรมราช', en: 'Khao Chum Thong Jn–Nakhon Si Thammarat', lines: ['S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['E']] }, data: `
@นครศรีธรรมราช
ชุมทางเขาชุมทอง;Khao Chum Thong Jn;S;781.01
บ้านเกยเชน;Ban Koei Chen;H;786.15
บ้านทุ่งหล่อ;Ban Thung Lo;S;790.59
โคกคราม;Khok Khram;S;794.67
บ้านห้วยยูง;Ban Huai Yung;H;798.72
บ้านท่าช้าง;Ban Tha Chang;H;803.4
วังวัว;Wang Wua;H;806.35
มะม่วงสองต้น;Mamuang Song Ton;H;810.88
นครศรีธรรมราช;Nakhon Si Thammarat;S;816.02` },

{ id: 'R24', th: 'ชุมทางหาดใหญ่–ปาดังเบซาร์', en: 'Hat Yai Jn–Padang Besar', lines: ['S'], base: 'ธนบุรี (บางกอกน้อย)',
  geom: { segs: [['SW']] }, data: `
@สงขลา
ชุมทางหาดใหญ่;Hat Yai Jn;S;928.58
คลองแงะ;Khlong Ngae;S;952.64
สทล. 973+316;Halt Km 973+316;H;973.31
ชายแดนไทย–มาเลเซีย;Thai–Malaysia Border;X;973.54
ปาดังเบซาร์;Padang Besar;S;973.84` },
];
