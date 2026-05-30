import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Database,
  Kanban,
  Lock,
  Moon,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sun,
  Trophy,
  UserCheck,
  Users,
  Workflow,
  Menu,
  X,
  Star,
  Zap,
  BarChart3,
  Target,
  Play,
  ArrowUpRight,
  ArrowUp,
  Sparkles,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import kulupLogo from '../public/kulüp360.png';

// System Screenshot Imports
import imgDashboard from '../public/dashboard-sayfasi.png';
import imgProfile from '../public/profil-sayfasi.png';
import imgLeaderboard from '../public/lidertablosu-sayfasi.png';
import imgEvents from '../public/etkinlik-sayfasi.png';
import imgMeetings from '../public/toplantı-sayfasi.png';
import imgCalendar from '../public/takvim-sayfasi.png';
import imgTasks from '../public/gorevhavuzu-sayfasi.png';
import imgProjects from '../public/proje-sayfasi.png';
import imgKanban from '../public/projekanban-sayfasi.png';
import imgTeam from '../public/ekibimiz-sayfasi.png';


/* =====================================================
   DATA
   ===================================================== */

const navItems = [
  { href: '#features', label: 'Özellikler' },
  { href: '#how-it-works', label: 'Nasıl Çalışır' },
  { href: '#audience', label: 'Kim İçin' },
  { href: '#screens', label: 'Ekranlar' },
  { href: '#trust', label: 'Güven' },
  { href: '#faq', label: 'SSS' },
];

const heroStats = [
  { value: '5', suffix: ' sn', label: 'Ortalama QR yoklama süresi' },
  { value: '6+', suffix: '', label: 'Birim ve komite desteği' },
  { value: '%100', suffix: '', label: 'Şeffaf katkı takibi' },
];

const painPoints = [
  {
    id: '01',
    icon: MessageSquare,
    title: 'Görev Sahipliği Belirsiz Kalmaz',
    desc: 'WhatsApp gruplarında kaybolan görevler yerine, her işin sorumlusu, durumu ve ilerleme bilgisi tek panelde görünür.',
  },
  {
    id: '02',
    icon: ClipboardList,
    title: 'Toplantı Yoklamasını Saniyeler İçinde Alın',
    desc: 'Dinamik QR kod ile katılım kayıtlarını manuel imza listelerine ihtiyaç duymadan doğrudan sisteme işleyin.',
  },
  {
    id: '03',
    icon: Target,
    title: 'Fikirler Göreve Dönüşür',
    desc: 'Topluluk içinde konuşulan fikirleri görev havuzuna taşıyın, sorumlu atayın ve ilerlemeyi görünür hale getirin.',
  },
  {
    id: '04',
    icon: Users,
    title: 'Üye Yeteneklerini Görünür Hale Getirin',
    desc: 'Üyelerin yazılım, tasarım, sponsorluk, iletişim ve operasyon yeteneklerini kaydedin; doğru kişiyi doğru göreve yönlendirin.',
  },
];

const features = [
  {
    icon: QrCode,
    tag: 'Yoklama',
    title: 'Dinamik QR Kod Entegrasyonu',
    desc: 'Toplantı ve etkinliklerde manuel imza listelerini ortadan kaldırın. Dinamik QR kod ile katılımı saniyeler içinde doğrulayın ve kayıtları doğrudan veritabanına işleyin.',
    benefits: ['Otomatik QR kod üretimi ve süre sınırı', 'Komite veya yönetici bazlı yoklama yetkisi', 'Kamera ile hızlı tarama arayüzü', 'Katılım kayıtlarının anlık olarak veritabanına işlenmesi'],
  },
  {
    icon: CheckSquare,
    tag: 'Katkı',
    title: 'Komite Görev Havuzu',
    desc: 'Yazılım, sponsorluk, tasarım ve operasyon birimlerinin ihtiyaç duyduğu işleri görev havuzunda listeleyin. Üyeler yeteneklerine uygun görevleri üstlenerek sürece katkı sağlar.',
    benefits: ['Birim liderleri tarafından görev tanımlama', 'Üyelerin gönüllü görev üstlenme sistemi', 'Geliştirme, içerik, tasarım ve operasyon süreçleri', 'Yönetim onaylı şeffaf katkı puanı'],
  },
  {
    icon: Kanban,
    tag: 'İşbirliği',
    title: 'Kanban Panosu ve Proje Yönetimi',
    desc: 'Topluluk projelerini, etkinlik hazırlıklarını ve komite işlerini Kanban panosu üzerinde planlayın. Her görevin durumunu, sorumlusunu ve ilerlemesini tek ekrandan takip edin.',
    benefits: ['Görsel görev kartları ve öncelik durumları', 'Komite veya proje ekibine özel görev atama', 'Tamamlanan işler için otomatik katkı puanı', 'Birimler arası ortak çalışma ve ilerleme takibi'],
  },
  {
    icon: Trophy,
    tag: 'Takdir',
    title: 'Katkı Sıralaması ve Yetenek Haritası',
    desc: 'Üyelerin tamamladığı görevler, katıldığı etkinlikler ve üstlendiği sorumluluklar katkı puanına dönüşür. Aylık sıralama ve yetenek profilleriyle aktif üyeler görünür hale gelir.',
    benefits: ['Üye profillerinde yetenek ve ilgi alanı takibi', 'Son 30 güne ait katkı puanlarının listelenmesi', 'Aylık sıralama ve başarı rozetleri', 'Topluluk içi şeffaf performans görünümü'],
  },
];

const flowSteps = [
  {
    id: '01',
    icon: Calendar,
    title: 'Planı oluşturun',
    desc: 'Toplantı, etkinlik veya proje fikrini sisteme ekleyin; ilgili birim ve komiteleri belirleyin.',
  },
  {
    id: '02',
    icon: Users,
    title: 'Katılımı doğrulayın',
    desc: 'Dinamik QR kod ile toplantı ve etkinlik katılımlarını saniyeler içinde kaydedin.',
  },
  {
    id: '03',
    icon: Zap,
    title: 'Görevleri sahiplenin',
    desc: 'Üyeler yeteneklerine uygun görevleri üstlenir; süreç Kanban panosu üzerinden takip edilir.',
  },
  {
    id: '04',
    icon: Trophy,
    title: 'Katkıyı Görünür Kılın',
    desc: 'Tamamlanan işler, katılımlar ve onaylanan görevler katkı puanına dönüşür; raporlar ve sıralamalar otomatik oluşur.',
  },
];

const audienceCards = [
  {
    icon: ShieldCheck,
    title: 'Yönetim Ekibi',
    desc: 'Topluluğun genel işleyişini, onay bekleyen başvuruları, etkinlikleri ve raporları tek panelden yönetir.',
    highlights: ['Birim taleplerini onaylama veya reddetme', 'Yeni üye ekleme ve rol atama', 'Toplantı kararları ve aksiyon takibi', 'Aylık aktiflik istatistiklerini görüntüleme'],
  },
  {
    icon: Users,
    title: 'Komite Liderleri',
    desc: 'Kendi birimlerinin projelerini, toplantılarını ve görev dağılımlarını yönetir; üye katkılarını takip eder.',
    highlights: ['Birimine özel görev havuzu oluşturma', 'Komite toplantısı ve QR yoklama başlatma', 'Üyelerin görev ilerlemelerini izleme', 'Yeteneklere göre görev yönlendirme'],
  },
  {
    icon: Trophy,
    title: 'Üyeler',
    desc: 'Etkinliklere katılır, yeteneklerine uygun görevleri üstlenir ve topluluk içindeki katkısını görünür hale getirir.',
    highlights: ['Görev havuzundan iş üstlenme', 'QR kod ile katılım kaydı oluşturma', 'Aylık katkı puanı kazanma', 'Yetenek profilini görünür kılma'],
  },
];

const screenPreviews = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Workflow,
    image: imgDashboard,
    desc: 'Topluluğun genel aktiflik oranlarını, bekleyen onayları, yaklaşan etkinlikleri ve son hareketleri gösteren ana panel.',
    highlights: ['Genel aktiflik ve katılım istatistikleri', 'Birim bazlı hızlı aktivite takibi', 'Hızlı durum kartları ve bildirimler']
  },
  {
    id: 'profile',
    title: 'Profilim',
    icon: UserCheck,
    image: imgProfile,
    desc: 'Üyenin kişisel katkı puanı özetini, yetenek etiketlerini, aylık ilerlemesini ve tamamladığı işlerin geçmişini sergiler.',
    highlights: ['Aylık katkı puanı ve ilerleme barı', 'Bireysel yetenek kartları (Linux, Tasarım, DevOps vb.)', 'Puan geçmişi ve rütbe detayları']
  },
  {
    id: 'leaderboard',
    title: 'Lider Tablosu',
    icon: Trophy,
    image: imgLeaderboard,
    desc: 'Tüm üyelerin aylık katkı puanlarına göre sıralandığı, ayın en çok katkı veren yıldızlarının öne çıktığı rekabet ekranı.',
    highlights: ['Aylık güncellenen dinamik sıralama', 'Ayın parlayan yıldızları ve liderlik kürsüsü', 'Adil ve şeffaf katılım verileri']
  },
  {
    id: 'events',
    title: 'Etkinlikler',
    icon: Calendar,
    image: imgEvents,
    desc: 'Topluluk içi ve dışı tüm teknik/sosyal etkinliklerin, eğitimlerin ve hackathonların listelendiği yönetim merkezi.',
    highlights: ['Detaylı etkinlik planlaması ve içerikler', 'Katılımcı listesi ve profil entegrasyonu', 'Etkinliğe özel QR kod oluşturma']
  },
  {
    id: 'meetings',
    title: 'Toplantılar',
    icon: Smartphone,
    image: imgMeetings,
    desc: 'Genel kurullar ve birim/komite koordinasyon toplantılarının yönetildiği, gündem ve kararların kaydedildiği ekran.',
    highlights: ['Toplantı gündemi, kararlar ve aksiyon maddeleri', 'Dinamik QR kodlu toplantı yoklaması', 'Toplantı katılımı için otomatik puanlama']
  },
  {
    id: 'calendar',
    title: 'Takvim',
    icon: Calendar,
    image: imgCalendar,
    desc: 'Yaklaşan tüm etkinliklerin, komite toplantılarının ve görev teslim tarihlerinin bir arada görüntülendiği entegre takvim.',
    highlights: ['Renk kodlu etkinlik ve toplantı takibi', 'Detaylı tarih pencereleri ve yönlendirmeler', 'Mobil uyumlu responsive takvim ızgarası']
  },
  {
    id: 'tasks',
    title: 'Görev Havuzu',
    icon: ClipboardList,
    image: imgTasks,
    desc: 'Topluluk genelinde veya komite özelinde açılan, zorluk seviyelerine ve kategorilerine göre filtrelenen işlerin listesi.',
    highlights: ['Kategori ve zorluk derecesine göre işler', 'Görevleri kendi üzerine alma (Claim) sistemi', 'İçerik, geliştirme ve sponsorluk işleri']
  },
  {
    id: 'projects',
    title: 'Projeler',
    icon: Target,
    image: imgProjects,
    desc: 'Birimler bünyesinde yürütülen tüm aktif projelerin, ekiplerinin ve tamamlanma oranlarının izlendiği yönetim sayfası.',
    highlights: ['Proje sahibi ve ekip üyeleri takibi', 'Proje tamamlanma oranlarının otomatik hesabı', 'Birim bazlı proje yetkilendirmesi']
  },
  {
    id: 'kanban',
    title: 'Kanban Pano',
    icon: Kanban,
    image: imgKanban,
    desc: 'Proje görevlerinin Yapılacak, Devam Ediyor ve Tamamlandı kolonlarında sürükle-bırak yöntemiyle yönetildiği tahta.',
    highlights: ['İşlerin durumunu gösteren 3 kolonlu pano', 'Kartları üzerine alma ve sürükle-bırak desteği', 'Tamamlanan işlerin otomatik puan ödülü']
  },
  {
    id: 'team',
    title: 'Ekibimiz',
    icon: Users,
    image: imgTeam,
    desc: 'Topluluktaki tüm komiteleri (DevOps, Sosyal Medya, İçerik vb.) ve bu komitelerin aktif üyelerini gösteren takım sayfası.',
    highlights: ['Komite bazlı üye filtreleme seçenekleri', 'Üyelerin rollerini ve unvanlarını görme', 'Hızlı profil kartları ve unvan detayları']
  },
];

const trustItems = [
  {
    icon: Lock,
    title: 'Rol Bazlı Yetkilendirme (RBAC)',
    desc: 'Başkan, yardımcı, komite lideri ve üye rolleri için ayrı erişim yetkileri tanımlanır.',
  },
  {
    icon: UserCheck,
    title: 'Kontrollü Üye Girişi',
    desc: 'Dışarıdan üyelik alımı kapatılabilir; kullanıcı hesapları yönetim tarafından oluşturulur veya onaylanır.',
  },
  {
    icon: ShieldCheck,
    title: 'Birim Bazlı Veri Erişimi',
    desc: 'Komite notları, kararlar ve görevler yalnızca ilgili birim ve yetkili kullanıcılar tarafından görüntülenir.',
  },
  {
    icon: Database,
    title: 'Güvenli Veri Altyapısı',
    desc: 'Üye, görev, proje ve katılım verileri ilişkisel veritabanı yapısıyla düzenli ve güvenli şekilde saklanır.',
  },
  {
    icon: Smartphone,
    title: 'Mobil Uyumlu Responsive Arayüz',
    desc: 'Yoklama alma, görev takibi ve profil güncellemeleri masaüstü ve mobil cihazlarda sorunsuz çalışır.',
  },
];

const faqItems = [
  {
    q: 'Kulüp360 nedir?',
    a: 'Kulüp360, öğrenci toplulukları, kulüpler ve derneklerin iç organizasyonunu, projelerini, komite toplantılarını ve aktiflik puanlarını yönetmek için özel olarak geliştirilmiş profesyonel bir iç yönetim portalıdır.',
  },
  {
    q: 'Sisteme kendim hesap oluşturup kayıt olabilir miyim?',
    a: 'Hayır, topluluk içi güvenliği ve düzeni korumamıza yardımcı olmak için üye hesapları sadece yönetim paneli üzerinden el ile eklenir.',
  },
  {
    q: 'Katkı puanları nasıl kazanılır?',
    a: 'Üyeler katıldıkları her komite veya genel toplantı için 5 puan, üstlendikleri görevlerin ve projelerin zorluk derecesine göre (15-80 arası) farklı katkı puanları kazanır.',
  },
  {
    q: 'QR kod ile katılım doğrulama nasıl çalışır?',
    a: 'Toplantı veya etkinlik esnasında yansıtılan dinamik QR kodu, üyeler kameraları aracılığıyla taratarak saniyeler içinde katılım kaydı oluşturur.',
  },
  {
    q: 'Toplantı notları ve kararlarını kimler görebilir?',
    a: 'Genel toplantı notları tüm üyelere açıkken, komite toplantılarının notları, kararları ve aksiyon maddeleri sadece ilgili komite üyelerine gösterilir.',
  },
  {
    q: 'Platform ticari amaçlı kullanılabilir mi?',
    a: 'Hayır, bu yazılım tamamen toplulukların iç kullanımı için geliştirilmiş, kar amacı gütmeyen yerli bir iç yönetim portalıdır.',
  },
];

const stats = [
  { value: 150, suffix: '+', label: 'Aktif Üye' },
  { value: 6, suffix: '', label: 'Aktif Çalışma Birimi' },
  { value: 1200, suffix: '+', label: 'QR Yoklama Kaydı' },
  { value: 100, suffix: '%', label: 'Aktiflik Verisi' },
];

/* =====================================================
   HELPER COMPONENTS
   ===================================================== */

function SectionHeading({ title, desc, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left' : 'text-center';
  return (
    <div className={`scroll-reveal max-w-3xl ${alignment} ${align === 'center' ? 'mx-auto' : ''}`}>
      <h2 className="lt-text-heading text-3xl sm:text-4xl md:text-5xl font-clash leading-tight text-white">
        {title}
      </h2>
      {desc && (
        <p className={`lt-text-body mt-4 text-sm sm:text-base leading-relaxed text-gray-400 max-w-2xl ${align === 'center' ? 'mx-auto' : 'mx-0'}`}>
          {desc}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ children, tone = 'red' }) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : 'border-[#b31d27]/20 bg-[#b31d27]/10 text-[#b31d27]';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${toneClass}`}>
      {children}
    </span>
  );
}

/* Counter hook for animated numbers */
function useCountUp(target, isVisible, duration = 2000) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return count;
}

/* =====================================================
   BENTO GRID CARD HELPER
   ===================================================== */
function BentoCard({ children, className = '', colSpan = 'col-span-1' }) {
  const cardRef = useRef(null);
  
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`scroll-reveal bento-card ${colSpan} ${className}`}
    >
      <div className="bento-card-spotlight" />
      <div className="relative z-10 h-full flex flex-col justify-between w-full">
        {children}
      </div>
    </div>
  );
}

/* =====================================================
   HERO FLOATING CARDS (Desktop)
   ===================================================== */
/* =====================================================
   HERO FLOATING CARDS (Desktop)
   ===================================================== */
function HeroFloatingCards({ pageLoading }) {
  return (
    <div className={`relative h-[520px] w-[430px] ${pageLoading !== true ? 'hero-fade-up hero-delay-4' : 'opacity-0'}`}>
      {/* Card 1: QR Attendance */}
      <div className="hero-float-card absolute right-0 top-0 w-[300px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#111111]/90 p-5 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27] dark:text-[#fca5a5]">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">QR Yoklama Aktif</div>
              <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Genel Kurul Toplantısı</div>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full w-[76%] rounded-full bg-[#b31d27]" />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
          <span>76 üye doğrulandı</span>
          <span className="font-semibold text-gray-900 dark:text-white">+5 katkı puanı</span>
        </div>
      </div>

      {/* Card 2: Active Task */}
      <div className="hero-float-card hero-float-card-two absolute left-0 top-[170px] w-[320px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#101010]/95 p-5 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27] dark:text-[#fca5a5]">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Görev İlerlemesi</div>
            <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Sponsorluk dosyası hazırlanıyor</div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-full w-[82%] rounded-full bg-[#b31d27]" />
          </div>
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">%82 tamamlandı</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-500">
          <span>Sorumlu: Melike H.</span>
          <span className="font-semibold text-gray-900 dark:text-white">Bugün</span>
        </div>
      </div>

      {/* Card 3: Leaderboard */}
      <div className="hero-float-card hero-float-card-three absolute bottom-0 right-4 w-[270px] rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#101010]/95 p-5 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#b31d27] dark:text-[#fca5a5]" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">Aylık Katkı Sıralaması</span>
          </div>
          <span className="text-[11px] text-[#b31d27] dark:text-[#fca5a5] font-semibold">İlk 3 üye</span>
        </div>
        {[
          ['Ahmet A.', '450 Puan'],
          ['Sude Naz A.', '380 Puan'],
          ['Duran G.', '320 Puan'],
        ].map(([name, point], index) => (
          <div key={name} className="flex items-center justify-between py-1.5 text-[11px]">
            <span className="text-gray-600 dark:text-gray-400">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-[9px] font-bold text-[#b31d27] dark:text-[#fca5a5] mr-2">
                {index + 1}
              </span>
              {name}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white font-clash">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================
   HERO MOBILE PREVIEW
   ===================================================== */
function MobileHeroPreview({ pageLoading }) {
  const [activeTab, setActiveTab] = useState('qr');
  const [scanCount, setScanCount] = useState(72);

  return (
    <div className={`${pageLoading !== true ? 'hero-fade-up hero-delay-5' : 'opacity-0'} hero-mobile-preview mt-8 w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#101010]/90 p-4 shadow-2xl shadow-black/10 dark:shadow-black/35 backdrop-blur-xl lg:hidden`}>
      <div className="flex rounded-xl bg-black/5 dark:bg-white/[0.03] p-1 border border-black/5 dark:border-white/10 mb-4">
        {[
          { id: 'qr', label: 'QR Yoklama' },
          { id: 'tasks', label: 'Görevler' },
          { id: 'rank', label: 'Katkı' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-2 text-xs font-bold rounded-lg transition-all z-10 ${
              activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {activeTab === tab.id && (
              <span className="absolute inset-0 bg-black/10 dark:bg-white/10 rounded-lg -z-10" />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {activeTab === tab.id && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#b31d27]" />
              )}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mobile-preview-console rounded-xl border border-black/5 dark:border-white/10 bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.04] dark:to-transparent p-4 min-h-[140px] flex flex-col justify-center">
        {activeTab === 'qr' && (
          <div className="space-y-3 slide-entry-active">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#b31d27] dark:text-[#fca5a5]" />
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">QR Yoklama Aktif</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div className="h-full w-[76%] rounded-full bg-[#b31d27]" />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500 dark:text-gray-400">{scanCount} üye doğrulandı</span>
              <button
                type="button"
                onClick={() => setScanCount((p) => p + 1)}
                className="text-[9px] bg-[#b31d27] text-white px-2 py-0.5 rounded-md font-bold hover:bg-[#961820] transition-colors"
              >
                Kodu Tara (+1)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2 slide-entry-active">
            {[
              { task: 'Sponsor dosyası güncelleme', status: 'Devam ediyor', pct: '82%' },
              { task: 'Sosyal medya afiş tasarımı', status: 'Onay bekliyor', pct: '100%' },
            ].map((item) => (
              <div key={item.task} className="flex items-center justify-between rounded-lg bg-black/5 dark:bg-white/[0.03] px-3 py-2.5 text-[11px]">
                <div>
                  <span className="text-gray-900 dark:text-white font-medium">{item.task}</span>
                  <span className="text-gray-500 ml-2">{item.status}</span>
                </div>
                <span className="text-[#b31d27] dark:text-[#fca5a5] font-mono font-bold">{item.pct}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="space-y-2 slide-entry-active">
            {[
              { name: 'Ahmet A.', pts: '450 Puan', rank: 1 },
              { name: 'Sen (Duran G.)', pts: '420 Puan', rank: 2 },
              { name: 'Sude Naz A.', pts: '380 Puan', rank: 3 },
            ].map((user) => (
              <div
                key={user.name}
                className={`flex items-center justify-between text-[11px] px-3 py-2 rounded-lg ${
                  user.name.includes('Sen')
                    ? 'bg-[#b31d27]/10 border border-[#b31d27]/25 text-[#b31d27] dark:text-white'
                    : 'bg-black/5 dark:bg-white/[0.02] text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>{user.rank}. {user.name}</span>
                <span className="font-mono text-gray-900 dark:text-white font-bold">{user.pts}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   SCREEN PREVIEW SIMULATOR
   ===================================================== */
function ScreenSimulator({ activeScreen }) {
  // Yoklama State
  const [scanCount, setScanCount] = useState(76);
  const [scannedMembers, setScannedMembers] = useState([
    { name: 'Mustafa Ö.', time: '14:02', xp: '+5 Puan' },
    { name: 'Efekan A.', time: '14:03', xp: '+5 Puan' },
    { name: 'Oğuzhan D.', time: '14:05', xp: '+5 Puan' }
  ]);
  const [showXpParticle, setShowXpParticle] = useState(false);
  const backupNames = ['Baran B.', 'Samet E.', 'Nida Ö.', 'Hivda G.', 'Eren A.', 'Rümeysa D.'];
  const [backupIdx, setBackupIdx] = useState(0);

  const handleScanSimulation = () => {
    setScanCount(prev => prev + 1);
    const newMember = {
      name: backupNames[backupIdx % backupNames.length],
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      xp: '+5 Puan'
    };
    setScannedMembers(prev => [newMember, ...prev].slice(0, 4));
    setBackupIdx(prev => prev + 1);
    
    // Trigger particle
    setShowXpParticle(true);
    setTimeout(() => setShowXpParticle(false), 800);
  };

  // Görev State
  const [task1Claimed, setTask1Claimed] = useState(false);
  const [task2Progress, setTask2Progress] = useState(45);
  
  const handleTask1Claim = () => {
    setTask1Claimed(prev => !prev);
  };
  
  const handleTask2Advance = () => {
    setTask2Progress(prev => {
      if (prev >= 100) return 45; // loop back
      return Math.min(prev + 15, 100);
    });
  };

  // Dashboard (Yaklaşan Etkinlik) State
  const [rsvpCount, setRsvpCount] = useState(24);
  const [rsvpStatus, setRsvpStatus] = useState(false);
  
  const handleRsvp = () => {
    setRsvpStatus(prev => !prev);
    setRsvpCount(prev => rsvpStatus ? prev - 1 : prev + 1);
  };

  // Rekabet (Leaderboard) State
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Ahmet A.', pts: 450, rank: 1, isYou: false },
    { name: 'Sude Naz A.', pts: 380, rank: 2, isYou: false },
    { name: 'Sen (Duran G.)', pts: 320, rank: 3, isYou: true },
    { name: 'Melike H.', pts: 290, rank: 4, isYou: false },
    { name: 'Eren A.', pts: 270, rank: 5, isYou: false }
  ]);

  const handleAddPts = () => {
    // Add 50 pts to "Sen (Duran G.)"
    const updated = leaderboard.map(user => {
      if (user.isYou) {
        return { ...user, pts: user.pts + 50 };
      }
      return user;
    });
    
    // Re-sort and assign rank
    updated.sort((a, b) => b.pts - a.pts);
    const reRanked = updated.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
    
    setLeaderboard(reRanked);
  };

  const handleResetLeaderboard = () => {
    setLeaderboard([
      { name: 'Ahmet A.', pts: 450, rank: 1, isYou: false },
      { name: 'Sude Naz A.', pts: 380, rank: 2, isYou: false },
      { name: 'Sen (Duran G.)', pts: 320, rank: 3, isYou: true },
      { name: 'Melike H.', pts: 290, rank: 4, isYou: false },
      { name: 'Eren A.', pts: 270, rank: 5, isYou: false }
    ]);
  };

  return (
    <div key={activeScreen} className="scroll-reveal product-frame p-4 sm:p-6 min-h-[300px] sm:min-h-[380px] screen-fade-in flex flex-col justify-between">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-gray-500">Sistem Aktif</span>
        </div>
        <span className="bg-white/5 px-2 py-0.5 rounded text-white font-sans text-[9px] uppercase font-bold">
          {activeScreen === 'attendance' && 'Yoklama Modülü'}
          {activeScreen === 'tasks' && 'Görev Havuzu'}
          {activeScreen === 'dashboard' && 'Yönetim Paneli'}
          {activeScreen === 'leaderboard' && 'Katkı Skorları'}
        </span>
      </div>

      {/* Screen contents */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Attendance (QR Scan) */}
        {activeScreen === 'attendance' && (
          <div className="space-y-4 slide-entry-active text-center py-2 relative">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
              <div className="relative p-2.5 border border-[#b31d27]/25 bg-black rounded-2xl w-24 h-24 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-white" />
                <div className="absolute inset-0 border border-[#b31d27] rounded-2xl pointer-events-none" />
                <div className="scan-laser" />
              </div>
              
              <div className="text-left space-y-2 flex-1 w-full max-w-[240px]">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Toplantı Yoklaması</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Aktif</span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">Toplam Katılım: <span className="text-white font-bold">{scanCount} Üye</span></div>
                
                {/* Micro-feed of last scans */}
                <div className="space-y-1 mt-1 border-t border-white/5 pt-1">
                  {scannedMembers.slice(0, 2).map((m, i) => (
                    <div key={m.name + i} className="flex justify-between text-[9px] text-gray-500 slide-entry-active">
                      <span className="text-gray-300">✓ {m.name}</span>
                      <span>{m.time} ({m.xp})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={handleScanSimulation}
                className="text-[11px] bg-[#b31d27] hover:bg-[#961820] text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-black/20"
              >
                <Smartphone className="h-3.5 w-3.5" /> Barkod Simüle Et (+5 Puan)
              </button>
            </div>

            {showXpParticle && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce z-20">
                +5 Puan Katıldı!
              </div>
            )}
          </div>
        )}

        {/* Tasks (Görev Havuzu) */}
        {activeScreen === 'tasks' && (
          <div className="space-y-3.5 slide-entry-active">
            {/* Task 1 */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 flex justify-between items-center transition-all hover:bg-white/[0.03]">
              <div>
                <div className="text-xs font-bold text-white">Sosyal Medya Bülten Tasarımı</div>
                <span className="text-[10px] text-[#b31d27] font-bold block mt-0.5">+30 Katkı Puanı</span>
              </div>
              <button
                type="button"
                onClick={handleTask1Claim}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  task1Claimed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30'
                    : 'bg-[#b31d27] text-white hover:bg-[#961820] shadow-md shadow-black/20'
                }`}
              >
                {task1Claimed ? 'Üstlendin ✓' : 'Görevi Üstlen'}
              </button>
            </div>

            {/* Task 2 */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 flex flex-col gap-2 transition-all hover:bg-white/[0.03]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">Sponsorluk Sunumu Revizyonu</div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Melike H. üstlendi</span>
                </div>
                <button
                  type="button"
                  onClick={handleTask2Advance}
                  className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-300 font-bold border border-white/10 px-2.5 py-1 rounded-md"
                >
                  İlerlet {task2Progress === 100 ? '(Sıfırla)' : `(+15%)`}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#b31d27] transition-all duration-500" style={{ width: `${task2Progress}%` }} />
                </div>
                <span className="text-[10px] font-mono text-gray-400 font-bold w-8 text-right">
                  {task2Progress}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard (Ana Sayfa) */}
        {activeScreen === 'dashboard' && (
          <div className="space-y-3.5 slide-entry-active">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Aylık Katkı', value: '1.240 P', icon: Trophy },
                { label: 'Aktif Görev', value: '28', icon: CheckSquare },
                { label: 'Yaklaşan', value: '6', icon: Calendar },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl border border-white/5 bg-white/[0.01] p-3 transition-all hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="text-[9px] font-bold uppercase">{m.label}</span>
                      <Icon className="h-3 w-3 text-[#b31d27]" />
                    </div>
                    <div className="text-sm font-bold text-white font-clash">{m.value}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 flex items-center justify-between transition-all hover:bg-white/[0.03]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b31d27]" />
                  <span className="text-[10px] text-[#b31d27] font-bold">Önemli Tarih</span>
                </div>
                <div className="text-xs font-bold text-white">Tanışma ve Oryantasyon Günü</div>
                <div className="text-[10px] text-gray-500">{rsvpCount} Üye RSVP oluşturdu</div>
              </div>
              
              <button
                type="button"
                onClick={handleRsvp}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  rsvpStatus
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {rsvpStatus ? 'Katılıyorum ✓' : 'Katılacağım'}
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard (Rekabet) */}
        {activeScreen === 'leaderboard' && (
          <div className="space-y-3 slide-entry-active">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white">Genel Katkı Sıralaması</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddPts}
                  className="text-[9px] bg-[#b31d27] hover:bg-[#961820] text-white font-bold px-2 py-0.5 rounded"
                >
                  Puan Ekle (+50)
                </button>
                <button
                  type="button"
                  onClick={handleResetLeaderboard}
                  className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 px-1.5 py-0.5 rounded border border-white/10"
                >
                  Sıfırla
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {leaderboard.map((user) => (
                <div
                  key={user.name}
                  className={`flex items-center justify-between text-[11px] py-1 px-2 rounded-md transition-all ${
                    user.isYou
                      ? 'bg-[#b31d27]/10 border border-[#b31d27]/20'
                      : 'bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                      user.rank <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      {user.rank}
                    </span>
                    <span className={user.isYou ? 'text-red-400 font-bold' : 'text-gray-300'}>
                      {user.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white">{user.pts} P</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   STATIC MOCKUPS FOR FEATURES
   ===================================================== */

function QrYoklamaMockup() {
  return (
    <div className="feature-mockup-content p-6 bg-gradient-to-br from-[#121212] to-[#1e1a1a] min-h-[300px] sm:min-h-[380px] flex flex-col justify-between select-none text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">QR Yoklama Terminali</span>
        </div>
        <span className="text-[10px] bg-[#b31d27]/10 text-[#b31d27] border border-[#b31d27]/20 px-2 py-0.5 rounded font-bold uppercase">Yoklama Aktif</span>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-8 justify-center my-auto w-full">
        <div className="relative p-3 border-2 border-dashed border-[#b31d27]/30 bg-black rounded-2xl w-32 h-32 flex items-center justify-center shadow-2xl shadow-black/20">
          <QrCode className="w-24 h-24 text-white" />
          <div className="scan-laser" />
        </div>
        <div className="flex-1 w-full max-w-[280px] space-y-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Son Giriş Yapanlar</span>
            <div className="space-y-2">
              {[
                { name: 'Mustafa Ö.', time: '18:42', status: 'Doğrulandı' },
                { name: 'Sude Naz A.', time: '18:43', status: 'Doğrulandı' },
                { name: 'Duran G.', time: '18:45', status: 'Doğrulandı' },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between text-[11px] border-b border-white/[0.03] pb-1.5 last:border-0 last:pb-0">
                  <span className="text-gray-300 font-medium">✓ {m.name}</span>
                  <span className="text-emerald-400 font-mono text-[9px] font-bold">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 px-1">
            <span>Toplam Katılım: <strong className="text-white">76 Üye</strong></span>
            <span>Katılım Oranı: <strong className="text-emerald-400 font-mono">%92</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GorevHavuzuMockup() {
  return (
    <div className="feature-mockup-content p-6 bg-gradient-to-br from-[#121212] to-[#161a1d] min-h-[300px] sm:min-h-[380px] flex flex-col justify-between select-none text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#b31d27]" />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Aktif Görev Havuzu</span>
        </div>
        <span className="text-[10px] bg-[#b31d27]/10 text-[#b31d27] border border-[#b31d27]/20 px-2 py-0.5 rounded font-bold uppercase">12 Açık İş</span>
      </div>
      <div className="my-auto space-y-3 py-2 w-full">
        {[
          { title: 'Sponsorluk Dosyası Güncellemesi', dept: 'Sponsorluk', difficulty: 'Zor', pts: '+30 Katkı Puanı', status: 'Melike H. Üstlendi', tone: 'amber' },
          { title: 'Etkinlik Afişinin Hazırlanması', dept: 'Tasarım', difficulty: 'Orta', pts: '+15 Katkı Puanı', status: 'Açık Görev', tone: 'crimson' },
          { title: 'Haftalık Bülten Metninin Yazılması', dept: 'İçerik', difficulty: 'Kolay', pts: '+10 Katkı Puanı', status: 'Tamamlandı', tone: 'emerald' },
        ].map((task) => (
          <div key={task.title} className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-3 flex items-center justify-between transition-all duration-300">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white leading-snug">{task.title}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">{task.dept}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>Zorluk: <strong className="text-gray-300">{task.difficulty}</strong></span>
                <span className="text-[#b31d27]/90 font-mono font-semibold">{task.pts}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
              task.tone === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : task.tone === 'amber'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-[#b31d27]/10 border-[#b31d27]/20 text-[#b31d27]'
            }`}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanMockup() {
  return (
    <div className="feature-mockup-content p-4 bg-gradient-to-br from-[#121212] to-[#151515] min-h-[300px] sm:min-h-[380px] flex flex-col justify-between select-none text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Kanban className="h-4 w-4 text-[#b31d27]" />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Proje Panosu (Kanban)</span>
        </div>
        <span className="text-[10px] bg-[#b31d27]/10 text-[#b31d27] border border-[#b31d27]/20 px-2 py-0.5 rounded font-bold uppercase">Sprint 2</span>
      </div>
      <div className="flex flex-col md:grid md:grid-cols-3 gap-3 flex-1 w-full pb-2 md:pb-6">
        {/* Column 1: Yapılacak */}
        <div className="rounded-xl bg-white/[0.01] border border-white/5 p-2 flex flex-col gap-2 min-h-[110px] md:min-h-[175px] lg:min-h-[220px] w-full md:w-auto md:min-w-0 flex-shrink-0">
          <div className="flex justify-between items-center px-1 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Yapılacak</span>
            <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">1</span>
          </div>
          <div className="rounded-lg bg-[#151515] border border-white/5 p-2.5 space-y-2 shadow-md">
            <span className="text-[10px] font-bold text-white block leading-snug">Sosyal Medya Görsel Planlaması</span>
            <div className="flex items-center justify-between text-[8px] text-gray-500">
              <span className="text-[#b31d27] font-mono font-bold">+10 Puan</span>
              <span className="bg-white/5 px-1 py-0.2 rounded uppercase">Tasarım</span>
            </div>
          </div>
        </div>

        {/* Column 2: Devam Eden */}
        <div className="rounded-xl bg-white/[0.01] border border-white/5 p-2 flex flex-col gap-2 min-h-[110px] md:min-h-[175px] lg:min-h-[220px] w-full md:w-auto md:min-w-0 flex-shrink-0">
          <div className="flex justify-between items-center px-1 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Devam Eden</span>
            <span className="text-[9px] bg-[#b31d27]/10 text-[#b31d27] px-1.5 py-0.5 rounded-full font-bold">1</span>
          </div>
          <div className="rounded-lg bg-[#151515] border border-white/5 p-2.5 space-y-2 shadow-md ring-1 ring-[#b31d27]/20">
            <span className="text-[10px] font-bold text-white block leading-snug">Sponsorluk Sunumunun Hazırlanması</span>
            <div className="flex items-center justify-between text-[8px]">
              <span className="text-[#b31d27] font-mono font-bold">+30 Puan</span>
              <span className="text-gray-500">Melike H.</span>
            </div>
            <div className="h-1 w-full bg-white/5 overflow-hidden rounded-full mt-1">
              <div className="h-full w-[82%] bg-[#b31d27] rounded-full" />
            </div>
          </div>
        </div>

        {/* Column 3: Tamamlanan */}
        <div className="rounded-xl bg-white/[0.01] border border-white/5 p-2 flex flex-col gap-2 min-h-[110px] md:min-h-[175px] lg:min-h-[220px] w-full md:w-auto md:min-w-0 flex-shrink-0">
          <div className="flex justify-between items-center px-1 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Tamamlanan</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">2</span>
          </div>
          {[
            { title: 'Docker Postgres Konfigürasyonu', pts: '+50 Puan', label: 'DevOps' },
            { title: 'Haftalık Bülten Yazısı', pts: '+10 Puan', label: 'İçerik' }
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-[#151515] border border-white/5 p-2.5 space-y-1.5 shadow-md opacity-70">
              <span className="text-[10px] font-bold text-white block leading-snug line-through">{item.title}</span>
              <div className="flex items-center justify-between text-[8px] text-emerald-400">
                <span className="font-mono font-bold">{item.pts} Kazanıldı</span>
                <span className="bg-white/5 text-gray-400 px-1 py-0.2 rounded uppercase">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiralamaMockup() {
  const [activeSkill, setActiveSkill] = useState(null);

  const skillsDetail = {
    software: { title: 'Yazılım & Docker (%88)', desc: 'Postgres & Node.js servislerini Dockerize etme, Compose ile çoklu konteyner yapıları, hafif imaj optimizasyonu.' },
    db: { title: 'Veritabanı / Postgres (%75)', desc: 'İndeksleme optimizasyonu, ilişkisel şemalar, sorgu planlama analizi ve yedekleme otomasyonu.' },
    design: { title: 'Tasarım / UI (%40)', desc: 'Figma ile tel kafes (wireframe) tasarımlar, modern cam yerleşimleri ve Tailwind prototipleme.' }
  };

  return (
    <div className="feature-mockup-content p-6 bg-gradient-to-br from-[#121212] to-[#1c1616] min-h-[300px] sm:min-h-[380px] flex flex-col justify-between select-none text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#b31d27]" />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Performans ve Yetenek Paneli</span>
        </div>
        <span className="text-[10px] bg-[#b31d27]/10 text-[#b31d27] border border-[#b31d27]/20 px-2 py-0.5 rounded font-bold uppercase">Mayıs Dönemi</span>
      </div>
      <div className="flex flex-col md:flex-row items-stretch gap-6 my-auto w-full">
        {/* Leaderboard list */}
        <div className="flex-1 space-y-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Aylık Sıralama (Top 3)</span>
          {[
            { name: 'Ahmet A.', pts: '450 Puan', rank: 1 },
            { name: 'Sude Naz A.', pts: '380 Puan', rank: 2 },
            { name: 'Duran G. (Sen)', pts: '320 Puan', rank: 3, isYou: true }
          ].map((u) => (
            <div key={u.name} className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg border transition-all duration-300 ${
              u.isYou 
                ? 'bg-[#b31d27]/10 border-[#b31d27]/25 text-white font-bold' 
                : 'bg-white/[0.01] border-white/5 text-gray-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                  u.rank === 1 ? 'bg-amber-400/20 text-amber-300' : u.rank === 2 ? 'bg-gray-400/20 text-gray-300' : 'bg-[#b31d27]/20 text-[#b31d27]'
                }`}>
                  {u.rank}
                </span>
                <span className={u.isYou ? 'text-white' : 'text-gray-300'}>{u.name}</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-white">{u.pts}</span>
            </div>
          ))}
        </div>

        {/* User profile card with SVG Radar Chart */}
        <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.01] p-3 flex flex-col h-[215px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
              <div className="h-6 w-6 rounded-full bg-[#b31d27]/20 text-[#b31d27] font-bold flex items-center justify-center text-[10px]">D</div>
              <div>
                <span className="text-xs font-bold text-white block">Duran G.</span>
                <span className="text-[9px] text-gray-500 leading-none block">DevOps Lider Yrd.</span>
              </div>
            </div>
            
            {/* SVG Radar Chart */}
            <div className="flex justify-center items-center h-[90px] relative my-1">
              <svg className="w-[110px] h-[90px]" viewBox="0 0 120 110">
                {/* Grid line scales */}
                <polygon points="60,25 94.64,85 25.36,85" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <polygon points="60,35 85.98,80 34.02,80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <polygon points="60,45 77.32,75 42.68,75" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                
                {/* Axes from center */}
                <line x1="60" y1="65" x2="60" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="60" y1="65" x2="94.64" y2="85" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="60" y1="65" x2="25.36" y2="85" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                {/* Actual data polygon */}
                <polygon 
                  points="60,29.8 85.98,80 46.15,73" 
                  fill="rgba(179, 29, 39, 0.2)" 
                  stroke="#b31d27" 
                  strokeWidth="1.2" 
                />

                {/* Visible Vertices */}
                <circle cx="60" cy="29.8" r="3.5" className="fill-[#b31d27] stroke-white stroke-[0.75] pointer-events-none" />
                <circle cx="85.98" cy="80" r="3.5" className="fill-[#b31d27] stroke-white stroke-[0.75] pointer-events-none" />
                <circle cx="46.15" cy="73" r="3.5" className="fill-[#b31d27] stroke-white stroke-[0.75] pointer-events-none" />

                {/* Invisible large hover/touch sensor targets */}
                <circle 
                  cx="60" cy="29.8" r="16" 
                  className="fill-transparent cursor-pointer"
                  onMouseEnter={() => setActiveSkill('software')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('software')}
                  onTouchEnd={() => setActiveSkill(null)}
                />
                <circle 
                  cx="85.98" cy="80" r="16" 
                  className="fill-transparent cursor-pointer"
                  onMouseEnter={() => setActiveSkill('db')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('db')}
                  onTouchEnd={() => setActiveSkill(null)}
                />
                <circle 
                  cx="46.15" cy="73" r="16" 
                  className="fill-transparent cursor-pointer"
                  onMouseEnter={() => setActiveSkill('design')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('design')}
                  onTouchEnd={() => setActiveSkill(null)}
                />

                {/* Axis Text Labels */}
                <text 
                  x="60" y="17" 
                  textAnchor="middle" 
                  className="text-[6.5px] fill-gray-400 font-bold uppercase cursor-pointer hover:fill-[#b31d27] transition-colors"
                  onMouseEnter={() => setActiveSkill('software')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('software')}
                  onTouchEnd={() => setActiveSkill(null)}
                >
                  Yazılım
                </text>
                <text 
                  x="96" y="93" 
                  textAnchor="middle" 
                  className="text-[6.5px] fill-gray-400 font-bold uppercase cursor-pointer hover:fill-[#b31d27] transition-colors"
                  onMouseEnter={() => setActiveSkill('db')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('db')}
                  onTouchEnd={() => setActiveSkill(null)}
                >
                  Veritabanı
                </text>
                <text 
                  x="20" y="93" 
                  textAnchor="middle" 
                  className="text-[6.5px] fill-gray-400 font-bold uppercase cursor-pointer hover:fill-[#b31d27] transition-colors"
                  onMouseEnter={() => setActiveSkill('design')}
                  onMouseLeave={() => setActiveSkill(null)}
                  onTouchStart={() => setActiveSkill('design')}
                  onTouchEnd={() => setActiveSkill(null)}
                >
                  Tasarım
                </text>
              </svg>
            </div>
            
            {/* Dynamic Interactive Description */}
            <div className="mt-1 h-[48px] overflow-hidden bg-white/[0.01] border border-white/5 rounded-lg p-1.5 transition-all">
              {activeSkill ? (
                <div className="slide-entry-active">
                  <div className="text-[9px] font-bold text-white leading-none mb-1">{skillsDetail[activeSkill].title}</div>
                  <div className="text-[8px] text-gray-400 leading-normal">{skillsDetail[activeSkill].desc}</div>
                </div>
              ) : (
                <div className="text-[8px] text-gray-500 text-center leading-normal py-1.5">
                  Detayları görmek için grafik köşelerine veya etiketlere dokunun.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   MAIN LANDING PAGE COMPONENT
   ===================================================== */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  const [isLightTheme, setIsLightTheme] = useState(() => {
    try {
      return localStorage.getItem('kulup360-landing-theme') === 'light';
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [activeAudienceTab, setActiveAudienceTab] = useState(0);
  const audienceTabRefs = useRef([]);
  const [audienceTabStyle, setAudienceTabStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateTabStyle = () => {
      const activeEl = audienceTabRefs.current[activeAudienceTab];
      if (activeEl) {
        setAudienceTabStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth
        });
      }
    };
    updateTabStyle();
    window.addEventListener('resize', updateTabStyle);
    return () => window.removeEventListener('resize', updateTabStyle);
  }, [activeAudienceTab]);

  const [activeScreenTab, setActiveScreenTab] = useState('dashboard');
  const [isScreenTransitioning, setIsScreenTransitioning] = useState(false);

  const handleScreenTabChange = useCallback((tabId) => {
    if (tabId === activeScreenTab || isScreenTransitioning) return;
    setIsScreenTransitioning(true);
    setTimeout(() => {
      setActiveScreenTab(tabId);
      setIsScreenTransitioning(false);
    }, 180);
  }, [activeScreenTab, isScreenTransitioning]);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', club: '', university: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const globalMouseRef = useRef({ x: -1000, y: -1000 });
  const mousePosRef = useRef({
    targetX: -1000,
    targetY: -1000,
    activeX: -1000,
    activeY: -1000,
    isHovering: false,
    hoverFactor: 0,
  });

  // Bento Grid states (Stage 3)
  const [bentoTaskStatus, setBentoTaskStatus] = useState('chat'); // 'chat' or 'task'
  const [bentoScanCount, setBentoScanCount] = useState(0);
  const [bentoScanAlert, setBentoScanAlert] = useState(false);
  const [bentoXpScore, setBentoXpScore] = useState(0);
  const [bentoTasks, setBentoTasks] = useState([
    { id: 1, text: 'Etkinlik afişinin hazırlanması', xp: 15, checked: false },
    { id: 2, text: 'Sponsorluk dosyasının güncellenmesi', xp: 30, checked: false },
    { id: 3, text: 'Haftalık bülten metninin yazılması', xp: 10, checked: false }
  ]);
  const [bentoMemberActive, setBentoMemberActive] = useState(0);

  // Floating Particle state
  const [xpParticle, setXpParticle] = useState(null);
  const particleTimeoutRef = useRef(null);

  const triggerXpParticle = (text) => {
    if (particleTimeoutRef.current) {
      clearTimeout(particleTimeoutRef.current);
    }
    setXpParticle(null);
    setTimeout(() => {
      setXpParticle(text);
      particleTimeoutRef.current = setTimeout(() => {
        setXpParticle(null);
      }, 900);
    }, 10);
  };

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Bento & Features Mobile Carousel states
  const [activeBentoIndex, setActiveBentoIndex] = useState(0);
  const bentoCarouselRef = useRef(null);
  const handleBentoScroll = useCallback((e) => {
    const container = e.target;
    const children = container.children;
    if (!children || children.length === 0) return;
    
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    setActiveBentoIndex(closestIndex);
  }, []);

  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  // Audience Tab Simulator States (Stage 6)
  const [presidentApprovals, setPresidentApprovals] = useState([
    { id: 1, title: 'Mobil Uygulama Geliştirme', type: 'Proje', committee: 'DevOps Ekibi', status: 'pending' },
    { id: 2, title: 'Tanışma ve Oryantasyon Günü', type: 'Etkinlik', committee: 'Etkinlik Komitesi', status: 'pending' }
  ]);
  const [leaderTasks, setLeaderTasks] = useState([
    { id: 1, title: 'Discord Sunucusu Konfigürasyonu', cat: 'DevOps', status: 'created' }
  ]);
  const [memberXp, setMemberXp] = useState(340);
  const [memberClaimed, setMemberClaimed] = useState(false);

  // Page reading progress bar ref & Timeline active step state (Stage 4)
  const progressBarRef = useRef(null);
  const [activeTimelineStep, setActiveTimelineStep] = useState('01');
  const timelineRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall page scroll progress and update DOM directly for high performance
      const progressBar = progressBarRef.current;
      if (progressBar) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${scrollPercent}%`;
      }

      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Scroll-based active step calculation for Split-Screen Layout
      const stepIds = ['01', '02', '03', '04'];
      let currentActive = '01';
      let minDistance = Infinity;
      
      stepIds.forEach(id => {
        const stepEl = document.getElementById(`timeline-step-${id}`);
        if (stepEl) {
          const r = stepEl.getBoundingClientRect();
          // Distance from vertical center of viewport
          const distance = Math.abs(r.top + r.height / 2 - windowHeight / 2);
          if (distance < minDistance) {
            minDistance = distance;
            currentActive = id;
          }
        }
      });
      setActiveTimelineStep(currentActive);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    const timer = setTimeout(handleScroll, 100);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Mouse tracking and canvas rendering for hero interactive dot grid
  useEffect(() => {
    // Disable interactive canvas on mobile to save performance and battery
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(hero);

    const handleMouseMove = (e) => {
      globalMouseRef.current.x = e.clientX;
      globalMouseRef.current.y = e.clientY;
      
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePosRef.current.targetX = x;
      mousePosRef.current.targetY = y;
      mousePosRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mousePosRef.current.isHovering = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      globalMouseRef.current.x = touch.clientX;
      globalMouseRef.current.y = touch.clientY;
      
      const rect = hero.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      mousePosRef.current.targetX = x;
      mousePosRef.current.targetY = y;
      mousePosRef.current.isHovering = true;
    };

    const handleTouchEnd = () => {
      mousePosRef.current.isHovering = false;
    };

    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);
    hero.addEventListener('touchmove', handleTouchMove, { passive: true });
    hero.addEventListener('touchstart', handleTouchMove, { passive: true });
    hero.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Animation Loop
    const draw = () => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Update target coordinates dynamically based on current scroll position
      if (mousePosRef.current.isHovering && globalMouseRef.current.x !== -1000) {
        mousePosRef.current.targetX = globalMouseRef.current.x - rect.left;
        mousePosRef.current.targetY = globalMouseRef.current.y - rect.top;
      }

      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;
      
      // Interpolate hoverFactor
      if (mouse.isHovering) {
        mouse.hoverFactor += (1 - mouse.hoverFactor) * 0.1;
      } else {
        mouse.hoverFactor += (0 - mouse.hoverFactor) * 0.08;
      }

      // Interpolate active coordinates
      if (mouse.activeX === -1000) {
        mouse.activeX = mouse.targetX;
        mouse.activeY = mouse.targetY;
      } else {
        mouse.activeX += (mouse.targetX - mouse.activeX) * 0.15;
        mouse.activeY += (mouse.targetY - mouse.activeY) * 0.15;
      }

      const gridSpacing = 32;
      const baseRadius = 0.55;
      
      // Proximity effect parameters (Tuned to be smaller and more subtle)
      const maxDist = 180; // Area of influence
      const maxRadius = 2.5; // How large dots get under the cursor
      const maxPush = 4.5; // How much dots bulge out in 3D (displaced away from cursor)
      
      // Centered horizontal grid start, top vertical alignment
      const centerX = width / 2;
      const startX = centerX - Math.floor(centerX / gridSpacing) * gridSpacing;
      const startY = 0;

      const defaultDotColor = isLightTheme 
        ? 'rgba(15, 23, 42, 0.04)'
        : 'rgba(255, 255, 255, 0.06)';

      for (let x = startX; x < width; x += gridSpacing) {
        for (let y = startY; y < height; y += gridSpacing) {
          const dx = x - mouse.activeX;
          const dy = y - mouse.activeY;
          const dist = Math.hypot(dx, dy);

          let drawX = x;
          let drawY = y;
          let radius = baseRadius;
          let color = defaultDotColor;
          let glowIntensity = 0;

          if (dist < maxDist && mouse.hoverFactor > 0.01) {
            const factor = (1 - dist / maxDist) * mouse.hoverFactor;
            const easeFactor = Math.sin(factor * Math.PI / 2); // Smooth ease-out

            // Grow size based on proximity
            radius = baseRadius + (maxRadius - baseRadius) * easeFactor;

            // Push coordinates outward to create the 3D bulge dome effect
            if (dist > 0.1) {
              const angle = Math.atan2(dy, dx);
              // Pushing effect peaks at a mid-point for maximum spherical bulge look
              const pushAmt = maxPush * Math.sin(factor * Math.PI) * mouse.hoverFactor;
              drawX += Math.cos(angle) * pushAmt;
              drawY += Math.sin(angle) * pushAmt;
            }

            glowIntensity = easeFactor;
            
            // Clean neutral slate/zinc color near the cursor (no neon red glow)
            if (isLightTheme) {
              color = `rgba(15, 23, 42, ${0.04 + 0.46 * easeFactor})`;
            } else {
              color = `rgba(255, 255, 255, ${0.06 + 0.34 * easeFactor})`;
            }
          }

          // Main dot
          ctx.beginPath();
          ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Removed red glowing outer halo for a clean, flat matte feel
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      hero.removeEventListener('touchmove', handleTouchMove);
      hero.removeEventListener('touchstart', handleTouchMove);
      hero.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isLightTheme]);

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Theme persistence and document root classes
  useEffect(() => {
    try {
      localStorage.setItem('kulup360-landing-theme', isLightTheme ? 'light' : 'dark');
    } catch {}
    
    if (isLightTheme) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light', 'landing-light');
      document.body.classList.remove('dark');
      document.body.classList.add('light', 'landing-light');
    } else {
      document.documentElement.classList.remove('light', 'landing-light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light', 'landing-light');
      document.body.classList.add('dark');
    }
  }, [isLightTheme]);

  // IntersectionObserver for scroll-reveal
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Stats intersection observer
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Hash scroll
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Circular clip-path theme swipe transition (Stage 5)
  const toggleTheme = (e) => {
    const isSupported = document.startViewTransition !== undefined;
    
    if (!isSupported) {
      setIsLightTheme((p) => !p);
      return;
    }
    
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    
    const goingToDark = isLightTheme;
    
    if (goingToDark) {
      document.documentElement.classList.add('transitioning-to-dark');
    } else {
      document.documentElement.classList.add('transitioning-to-light');
    }
    
    const transition = document.startViewTransition(() => {
      setIsLightTheme((p) => !p);
    });
    
    transition.ready.then(() => {
      const clipPath = goingToDark
        ? [
            `circle(${endRadius}px at ${x}px ${y}px)`,
            `circle(0px at ${x}px ${y}px)`
          ]
        : [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ];
          
      const pseudoElement = goingToDark
        ? '::view-transition-old(root)'
        : '::view-transition-new(root)';

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: pseudoElement,
          fill: 'forwards',
        }
      );
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove('transitioning-to-dark', 'transitioning-to-light');
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  // Card spotlight cursor tracker (replaces 3D tilt to prevent React state collision & jitter)
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  // Scroll timeline step smooth navigator
  const scrollToStep = (id) => {
    const el = document.getElementById(`timeline-step-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Render simplified step visual for mobile display
  const renderStepVisual = (id) => {
    const isSelected = activeTimelineStep === id || hoveredStep === id;
    
    switch (id) {
      case '01':
        return (
          <div className={`w-full p-4 bg-black/40 border rounded-xl text-xs text-gray-400 transition-all duration-500 ${isSelected ? 'border-[#b31d27]/30 opacity-100' : 'border-white/5 opacity-60'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">Etkinlik Taslağı</span>
              <span className="text-[#b31d27] font-bold font-mono">%66 Tamam</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Etkinlik Gündemi</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Tarih & Mekan</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <div className="h-3.5 w-3.5 rounded-full border border-gray-600 flex items-center justify-center text-[8px]">○</div>
                <span>Görev Dağıtımı</span>
              </div>
            </div>
          </div>
        );
      case '02':
        return (
          <div className={`w-full p-4 bg-black/40 border rounded-xl text-xs text-gray-400 transition-all duration-500 ${isSelected ? 'border-[#b31d27]/30 opacity-100' : 'border-white/5 opacity-60'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">Katılım Terminali</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-[#b31d27]/20 border border-[#b31d27]/30 rounded flex items-center justify-center text-[8px] text-white font-bold font-mono">QR</div>
                <span>Duran G. okuttu</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all duration-500 ${isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' : 'bg-white/5 text-gray-400'}`}>
                {isSelected ? '✓ Doğrulandı' : 'Bekleniyor'}
              </span>
            </div>
          </div>
        );
      case '03':
        return (
          <div className={`w-full p-4 bg-black/40 border rounded-xl text-xs text-gray-400 transition-all duration-500 ${isSelected ? 'border-[#b31d27]/30 opacity-100' : 'border-white/5 opacity-60'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">İş Dağılımı</span>
              <span className="text-gray-500 font-mono">1 Görev</span>
            </div>
            <div className="relative h-9 bg-white/[0.02] border border-white/5 rounded-lg flex items-center px-2 overflow-hidden">
              <div className={`h-6 bg-[#b31d27]/20 border border-[#b31d27]/30 rounded-md text-[9px] font-bold px-2.5 flex items-center gap-1.5 absolute transition-all duration-700 ${isSelected ? 'left-[35%] bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'left-[5%]'}`}>
                <span>{isSelected ? '✓ Benim İşim' : 'Açık Görev'}</span>
              </div>
            </div>
          </div>
        );
      case '04':
        return (
          <div className={`w-full p-4 bg-black/40 border rounded-xl text-xs text-gray-400 transition-all duration-500 ${isSelected ? 'border-[#b31d27]/30 opacity-100' : 'border-white/5 opacity-60'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">Katkı Liderliği</span>
              <Trophy className={`h-4 w-4 transition-transform duration-500 ${isSelected ? 'text-amber-400 scale-125 rotate-12' : 'text-gray-500'}`} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span>3. Duran G. (DevOps)</span>
              <span className="font-mono text-white font-bold text-xs bg-white/5 px-2 py-0.5 rounded">
                {isSelected ? '370 P' : '320 P'}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render high-fidelity sticky mockup browser window for desktop timeline
  const renderStickyMockup = () => {
    return (
      <div className="timeline-sticky-mockup w-full max-w-md bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 relative ring-1 ring-white/5 mx-auto transition-all duration-500">
        {/* Window header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">Workspace Simülatörü</span>
          <span className="w-8"></span> {/* Spacer */}
        </div>
        
        {/* Dashboard Content Panel */}
        <div className="bg-[#0c0c0c] p-6 min-h-[240px] flex flex-col justify-center">
          {activeTimelineStep === '01' && (
            <div className="space-y-4 slide-entry-active">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-clash">Yönetim Kurulu Toplantısı</h5>
                  <span className="text-[10px] text-gray-500">Etkinlik Planlama Modülü</span>
                </div>
                <span className="text-[10px] text-[#b31d27] font-bold font-mono bg-[#b31d27]/10 px-2.5 py-1 rounded border border-[#b31d27]/25">%66 Hazır</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-2.5 text-emerald-400">
                  <CheckSquare className="h-4 w-4" />
                  <div>
                    <div className="font-bold text-white">Etkinlik Gündemi</div>
                    <div className="text-[9px] text-gray-500">Hazırlandı</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-2.5 text-emerald-400">
                  <CheckSquare className="h-4 w-4" />
                  <div>
                    <div className="font-bold text-white">Tarih & Mekan</div>
                    <div className="text-[9px] text-gray-500">Oda 204 Rezerve</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-2.5 text-gray-500 col-span-2">
                  <div className="h-4 w-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px] font-bold">○</div>
                  <div className="ml-1">
                    <div className="font-bold text-gray-400">Görev Dağıtımı</div>
                    <div className="text-[9px] text-gray-600">Henüz Atanmadı</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTimelineStep === '02' && (
            <div className="space-y-4 slide-entry-active">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-clash">QR Yoklama Terminali</h5>
                  <span className="text-[10px] text-emerald-400">Dinamik Kapı Geçiş Doğrulama</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                <div className="h-12 w-12 rounded-xl bg-black border border-[#b31d27]/25 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <QrCode className="h-7 w-7 text-white" />
                  <div className="absolute inset-x-0 h-[1.5px] bg-[#b31d27] top-0 scan-laser" />
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Duran G. (DevOps)</span>
                    <span className="text-[9px] font-mono text-gray-500">14:02:15</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">✓ İzin Verildi</span>
                    <span className="text-gray-400 font-bold">+5 XP Katkı Puanı</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTimelineStep === '03' && (
            <div className="space-y-4 slide-entry-active">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-clash">Birim Görev Havuzu</h5>
                  <span className="text-[10px] text-gray-500">Kanban Panosu Entegrasyonu</span>
                </div>
                <span className="text-[9px] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded font-mono">1 Açık İş</span>
              </div>
              
              <div className="space-y-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex justify-between items-center transition-all hover:bg-white/[0.02]">
                  <div>
                    <div className="text-xs font-bold text-white">Sponsorluk Sunumu Revizyonu</div>
                    <span className="text-[9px] text-[#b31d27] font-bold block mt-1">+45 Katkı Puanı</span>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shadow-sm">
                    ✓ Benim İşim
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {activeTimelineStep === '04' && (
            <div className="space-y-4 slide-entry-active">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider font-clash">Üye Başarı ve Katkı</h5>
                  <span className="text-[10px] text-gray-500">Dönem Sonu Performans Skoru</span>
                </div>
                <Trophy className="h-5 w-5 text-amber-400 animate-bounce" />
              </div>
              
              <div className="bg-gradient-to-r from-[#b31d27]/10 to-transparent border border-[#b31d27]/15 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-clash font-bold text-white text-sm">
                    DG
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Duran G.</div>
                    <div className="text-[9px] text-gray-500">DevOps Birim Lideri</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono font-clash">370 XP</div>
                  <div className="text-[9px] text-emerald-400 font-bold">+50 XP Görev Tamamlama</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`landing-fixed-bg font-inter ${isLightTheme ? 'landing-light' : ''}`}>
      {/* Page Reading Progress Bar */}
      <div 
        ref={progressBarRef}
        className="fixed top-0 left-0 h-[1.5px] bg-[#b31d27] z-[10000] transition-all duration-75 ease-out pointer-events-none" 
        style={{ width: '0%' }}
      />
      {/* Splash Preloader */}
      {pageLoading !== 'done' && (
        <div 
          className={`splash-loader-container ${!pageLoading ? 'splash-loader-exit' : ''}`}
          onTransitionEnd={() => setPageLoading('done')}
        >
          <div className="splash-grid-glow" />
          <img src={kulupLogo} alt="Kulüp360 Logo" className="h-28 sm:h-36 w-auto splash-logo-img brightness-0 invert" />
          <div className="splash-progress-track">
            <div className="splash-progress-bar" />
          </div>
        </div>
      )}

      <nav
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 ${
          pageLoading === true
            ? 'opacity-0 -translate-y-4 pointer-events-none'
            : 'opacity-100 translate-y-0'
        } ${
          isScrolled
            ? 'navbar-scrolled landing-nav-scrolled w-[92%] max-w-7xl'
            : 'w-full bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img src={kulupLogo} alt="Kulüp360" className="h-12 sm:h-13 w-auto brightness-0 invert transition-transform duration-300 hover:scale-105" />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="lt-text-body px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-theme-toggle flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/30 transition-all"
              aria-label="Tema değiştir"
            >
              {isLightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-600/20"
              >
                Panele Git <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-all"
                >
                  Giriş Yap
                </Link>
                <a
                  href="#contact"
                  className="hidden md:inline-flex lt-btn-primary items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-600/20"
                >
                  Demo Talep Et <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
              aria-label="Menüyü aç"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navbar glow border */}
        {isScrolled && <div className="navbar-border-glow" />}
      </nav>

      {/* ============================
          MOBILE DRAWER
          ============================ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] drawer-overlay-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div
            className="drawer-content-slide-in absolute right-0 top-0 bottom-0 w-72 bg-black/65 border-l border-white/10 p-6 flex flex-col backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <img src={kulupLogo} alt="Kulüp360" className="h-10 sm:h-11 w-auto brightness-0 invert" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              {navItems.map((item, idx) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors drawer-item-slide"
                  style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-auto space-y-2 pt-6 border-t border-white/10">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white drawer-item-slide"
                  style={{ animationDelay: `${(navItems.length + 1) * 60}ms` }}
                >
                  Panele Git <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white drawer-item-slide"
                    style={{ animationDelay: `${(navItems.length + 1) * 60}ms` }}
                  >
                    Giriş Yap
                  </Link>
                  <a
                    href="#contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white drawer-item-slide"
                    style={{ animationDelay: `${(navItems.length + 2) * 60}ms` }}
                  >
                    Demo Talep Et <ArrowUpRight className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================
          HERO SECTION
          ============================ */}
      <section ref={heroRef} id="hero" className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 sm:py-20 overflow-hidden text-left lg:text-left cosmic-grid-container scroll-snap-section">
        {/* Cosmic Grid Background */}
        <canvas ref={canvasRef} className="hidden md:block absolute inset-0 pointer-events-none z-0" />
        
        {/* Background orbs */}
        <div className="orb orb-red-1 -top-32 left-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[500px]">
            {/* Left Column: Text Content & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
              <h1 className={`${pageLoading !== true ? 'hero-title-enter' : 'opacity-0'} hero-main-title text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-clash leading-[1.08] text-white tracking-tight`}>
                Topluluk yönetimini <br className="hidden sm:block" />
                <span className={`${pageLoading !== true ? 'hero-title-accent-enter' : 'opacity-0'} text-[#b31d27] pb-2`}>
                  tek merkezde toplayın
                </span>
              </h1>

              <p className={`${pageLoading !== true ? 'hero-fade-up hero-delay-3' : 'opacity-0'} mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 lt-text-body`}>
                Kulüp360; öğrenci kulüpleri ve topluluklar için etkinlik, görev, üye, komite, QR yoklama ve katkı takibi süreçlerini tek panelde yöneten modern bir iç yönetim platformudur.
              </p>

              <div className={`${pageLoading !== true ? 'hero-fade-up hero-delay-4' : 'opacity-0'} mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4 items-center w-full`}>
                <Link
                  to="/login"
                  className="lt-btn-glow-sweep w-full sm:w-auto inline-flex hover:-translate-y-0.5 transition-transform"
                >
                  <span className="lt-btn-glow-sweep-content font-bold justify-center">
                    Sisteme Giriş Yap <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                </Link>
                <a
                  href="#screens"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all lt-text-heading hover:-translate-y-0.5 lt-btn-secondary-glow"
                >
                  Demo Ekranlarını Gör
                </a>
              </div>
              
              <div className={`${pageLoading !== true ? 'hero-fade-up hero-delay-5' : 'opacity-0'} mt-10 flex justify-center lg:justify-start gap-8 sm:gap-12 border-t border-white/5 pt-8`}>
                {heroStats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-clash text-white">
                      {stat.value}
                      <span className="text-[#b31d27]">{stat.suffix}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 lt-text-muted font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Hero Graphic / Cards */}
            <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
              <HeroFloatingCards pageLoading={pageLoading} />
            </div>

            {/* Mobile Hero Preview */}
            <MobileHeroPreview pageLoading={pageLoading} />
          </div>
        </div>
      </section>
      <section id="problems" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Neden Kulüp360?"
            desc="Görev takibi, yoklama, üye yönetimi ve katkı ölçümünü tek sistemde birleştirerek topluluk operasyonlarındaki dağınıklığı azaltın."
          />

          {/* Gamified score indicator */}
          <div className="scroll-reveal mt-8 flex justify-center items-center gap-3 relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b31d27]/20 bg-[#b31d27]/10 px-4 py-2 text-xs font-bold text-[#fca5a5] relative">
              <Trophy className="h-4 w-4 text-[#b31d27]" />
              <span>Toplam Katkı Puanı:</span>
              <span className="bg-[#b31d27] text-white rounded-md px-2 py-0.5 font-clash text-sm transition-all duration-300">{bentoXpScore}</span>
              {xpParticle && (
                <span className="xp-float-particle absolute -top-8 left-1/2 -translate-x-1/2 bg-[#b31d27] text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full z-20 whitespace-nowrap shadow-md">
                  {xpParticle}
                </span>
              )}
            </div>
            {bentoXpScore > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  setBentoXpScore(0);
                  setXpParticle(null);
                  setBentoTaskStatus('chat');
                  setBentoScanCount(0);
                  setBentoScanAlert(false);
                  setBentoTasks([
                    { id: 1, text: 'Etkinlik afişinin hazırlanması', xp: 15, checked: false },
                    { id: 2, text: 'Sponsorluk dosyasının güncellenmesi', xp: 30, checked: false },
                    { id: 3, text: 'Haftalık bülten metninin yazılması', xp: 10, checked: false }
                  ]);
                }}
                className="text-[10px] text-gray-500 hover:text-[#b31d27] transition-colors uppercase font-bold"
              >
                Simülasyonu Sıfırla
              </button>
            )}
          </div>

          <div ref={bentoCarouselRef} onScroll={handleBentoScroll} className="mt-12 bento-grid mobile-bento-carousel stagger-children no-scrollbar">
            {/* Bento Card 1: WhatsApp Sim (Col-span-2) */}
            <BentoCard colSpan="md:col-span-2" className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b31d27] dark:text-[#fca5a5]">
                    <span className="h-1 w-1 rounded-full bg-[#b31d27]" />
                    <span>GÖREV TAKİBİ</span>
                  </span>
                </div>
                <h3 className="text-xl font-clash text-white">Görev sahipliği belirsiz kalmaz</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  WhatsApp gruplarında kaybolan görevler yerine, her işin sorumlusu, durumu ve ilerleme bilgisi tek panelde görünür.
                </p>
              </div>

              {/* Chat / Task simulator interface */}
              <div className="mt-6 rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-3 sm:p-4 min-h-[160px] flex flex-col justify-between">
                {bentoTaskStatus === 'chat' ? (
                  <div className="flex flex-col w-full">
                    <div className="whatsapp-bubble whatsapp-incoming">
                      <strong>Melike (Sponsorluk):</strong> Sponsorluk sunumu ne durumda arkadaşlar? Komite grubuna yazmıştım ama arada kaynadı...
                    </div>
                    <div className="whatsapp-bubble whatsapp-incoming">
                      <strong>Sude Naz (Tasarım Lideri):</strong> Afiş tasarımları hazır ama vize haftam başladı, kim web sitesine yükleyecek?
                    </div>
                    <div className="whatsapp-bubble whatsapp-outgoing">
                      <strong>Duran (DevOps):</strong> Görevleri sisteme ekleyelim, herkes kendi alanındaki işi oradan üstlensin ve takip etsin.
                    </div>
                    <div className="mt-4 flex justify-center sm:justify-end w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setBentoTaskStatus('task');
                          setBentoXpScore(prev => prev + 25);
                          triggerXpParticle('+25');
                        }}
                        className="text-xs bg-[#b31d27] hover:bg-[#961820] text-white font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md w-full sm:w-auto active:scale-[0.98] transition-all"
                      >
                        <Zap className="h-3.5 w-3.5" /> Portala Aktar (+25 Puan)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col w-full slide-entry-active">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">GÖREV HAVUZU</span>
                      <StatusBadge tone="green">Aktif</StatusBadge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs border border-white/5">
                        <span className="text-white font-medium">Etkinlik afişinin hazırlanması</span>
                        <span className="text-[10px] text-[#fca5a5] font-bold bg-[#b31d27]/10 px-2 py-0.5 rounded">Açık Görev</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs border border-white/5">
                        <span className="text-white font-medium">Sponsorluk sunumunun revizyonu</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Mustafa Ö. üstlendi</span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
                      <span>✓ Kaos çözüldü!</span>
                      <button
                        type="button"
                        onClick={() => setBentoTaskStatus('chat')}
                        className="text-[#fca5a5] font-bold hover:underline active:opacity-70"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </BentoCard>

            {/* Bento Card 2: QR Scanner (Col-span-1) */}
            <BentoCard colSpan="md:col-span-1" className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b31d27] dark:text-[#fca5a5]">
                    <span className="h-1 w-1 rounded-full bg-[#b31d27]" />
                    <span>QR YOKLAMA</span>
                  </span>
                </div>
                <h3 className="text-xl font-clash text-white">Toplantı yoklamasını saniyeler içinde alın</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Dinamik QR kod ile katılım kayıtlarını manuel imza listelerine ihtiyaç duymadan doğrudan sisteme işleyin.
                </p>
              </div>

              {/* QR scanner simulator */}
              <div className="mt-6 rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 min-h-[160px] flex flex-col items-center justify-center relative">
                <div className="scan-laser" />
                <div className="relative p-2 border border-[#b31d27]/30 bg-black rounded-lg w-20 h-20 flex items-center justify-center cursor-pointer hover:border-[#b31d27] transition-colors active:scale-95 transition-all"
                  onClick={() => {
                    setBentoScanCount(prev => prev + 1);
                    setBentoXpScore(prev => prev + 10);
                    triggerXpParticle('+10');
                    setBentoScanAlert(true);
                    setTimeout(() => setBentoScanAlert(false), 1500);
                  }}
                >
                  <QrCode className="h-14 w-14 text-white" />
                </div>
                
                <div className="mt-3 text-center">
                  <div className="text-[11px] font-bold text-white">Yoklamayı Simüle Et</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{bentoScanCount} katılım kaydedildi</div>
                </div>

                {bentoScanAlert && (
                  <div className="absolute inset-x-0 bottom-2 mx-auto w-max bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg slide-entry-active">
                    Duran G. katıldı! (+10 Katkı Puanı)
                  </div>
                )}
              </div>
            </BentoCard>

            {/* Bento Card 3: Interactive Checklist (Col-span-1) */}
            <BentoCard colSpan="md:col-span-1" className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b31d27] dark:text-[#fca5a5]">
                    <span className="h-1 w-1 rounded-full bg-[#b31d27]" />
                    <span>GÖREV AKIŞI</span>
                  </span>
                </div>
                <h3 className="text-xl font-clash text-white">Fikirler göreve dönüşür</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Topluluk içinde konuşulan fikirleri görev havuzuna taşıyın, sorumlu atayın ve ilerlemeyi görünür hale getirin.
                </p>
              </div>

              {/* Checklist simulator */}
              <div className="mt-6 rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 min-h-[160px] flex flex-col justify-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Tamamlanacak görevler</div>
                <div className="space-y-2">
                  {bentoTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        const updated = bentoTasks.map(item => {
                          if (item.id === t.id) {
                            const newChecked = !item.checked;
                            setBentoXpScore(prev => newChecked ? prev + item.xp : prev - item.xp);
                            triggerXpParticle(newChecked ? `+${item.xp}` : `-${item.xp}`);
                            return { ...item, checked: newChecked };
                          }
                          return item;
                        });
                        setBentoTasks(updated);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer select-none py-1 group/item active:opacity-80 transition-all"
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                        t.checked 
                          ? 'bg-[#b31d27] border-[#b31d27] text-white' 
                          : 'border-white/20 bg-white/5 group-hover/item:border-[#b31d27]'
                      }`}>
                        {t.checked && <CheckCircle className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs bento-task-item ${t.checked ? 'bento-task-checked text-gray-500' : 'text-white'}`}>
                        {t.text}
                      </span>
                      <span className={`text-[9px] font-bold font-mono ml-auto ${t.checked ? 'text-gray-600' : 'text-[#fca5a5]'}`}>
                        +{t.xp} Puan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Bento Card 4: Talent Pool (Col-span-2) */}
            <BentoCard colSpan="md:col-span-2" className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="rounded-xl border border-[#b31d27]/20 bg-[#b31d27]/10 p-2.5 text-[#b31d27]">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b31d27] dark:text-[#fca5a5]">
                    <span className="h-1 w-1 rounded-full bg-[#b31d27]" />
                    <span>YETENEK HARİTASI</span>
                  </span>
                </div>
                <h3 className="text-xl font-clash text-white">Üye yeteneklerini görünür hale getirin</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Üyelerin yazılım, tasarım, sponsorluk, iletişim ve operasyon yeteneklerini kaydedin; doğru kişiyi doğru göreve yönlendirin.
                </p>
              </div>

              {/* Members talent simulator */}
              <div className="mt-6 rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 min-h-[160px] flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="sm:hidden text-[9px] text-gray-500 font-bold uppercase mb-1.5 text-center flex items-center justify-center gap-1">
                    Üyeleri Kaydır ↔
                  </span>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    {[
                      { name: 'Sude Naz A.', role: 'Tasarımcı', level: 'Tasarım Lideri' },
                      { name: 'Duran G.', role: 'Geliştirici', level: 'DevOps Lider Yard.' },
                      { name: 'Melike H.', role: 'Sponsorluk', level: 'Sponsorluk Lideri' }
                    ].map((m, idx) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => {
                          setBentoMemberActive(idx);
                          setBentoXpScore(prev => prev + 5);
                          triggerXpParticle('+5');
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all w-full min-w-[130px] active:scale-[0.98] ${
                          bentoMemberActive === idx
                            ? 'bg-[#b31d27]/10 border border-[#b31d27]/25 text-[#b31d27] dark:text-white'
                            : 'bg-white/5 border-transparent hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="h-7 w-7 rounded-full bg-[#b31d27]/20 text-[#fca5a5] font-bold flex items-center justify-center text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-none">{m.name}</div>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">{m.level}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full rounded-lg bg-white/[0.02] border border-white/5 p-3 flex flex-col justify-center min-h-[110px] slide-entry-active">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Yetenek & Katkı Detayı</span>
                    <span className="text-[10px] text-[#fca5a5] font-mono font-bold">
                      {bentoMemberActive === 0 ? 'Görsel / Video' : bentoMemberActive === 1 ? 'Yazılım / Sistem' : 'İletişim / Finans'}
                    </span>
                  </div>
                  
                  {bentoMemberActive === 0 && (
                    <div className="space-y-1.5 text-xs slide-entry-active">
                      <div className="text-white font-medium">Sude Naz A. — Tasarım Lideri</div>
                      <div className="text-[10px] text-gray-500">Tamamlanan Görevler: 14 Afiş Tasarımı, 3 Instagram Kurgusu.</div>
                      <div className="text-[10px] text-emerald-400">✓ Liderlik Tablosunda ilk 3 sıralamasında</div>
                    </div>
                  )}

                  {bentoMemberActive === 1 && (
                    <div className="space-y-1.5 text-xs slide-entry-active">
                      <div className="text-white font-medium">Duran G. — DevOps Lider Yard.</div>
                      <div className="text-[10px] text-gray-500">Tamamlanan Görevler: 2 Server Deployment, PostgreSQL entegrasyonu.</div>
                      <div className="text-[10px] text-emerald-400">✓ Platformun API ve veritabanı altyapısını optimize etti</div>
                    </div>
                  )}

                  {bentoMemberActive === 2 && (
                    <div className="space-y-1.5 text-xs slide-entry-active">
                      <div className="text-white font-medium">Melike H. — Sponsorluk Lideri</div>
                      <div className="text-[10px] text-gray-500">Tamamlanan Görevler: 4 Kurumsal Görüşme, 1 Sponsorluk Anlaşması.</div>
                      <div className="text-[10px] text-emerald-400">✓ Yeni sponsor görüşmesi sisteme kaydedildi.</div>
                    </div>
                  )}
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Bento Carousel Indicators for Mobile */}
          <div className="flex lg:hidden justify-center items-center gap-1.5 mt-4">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const container = bentoCarouselRef.current;
                  if (container && container.children[idx]) {
                    const card = container.children[idx];
                    container.scrollTo({
                      left: card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeBentoIndex === idx ? 'w-5 bg-[#b31d27]' : 'w-1.5 bg-gray-600/40'
                }`}
                aria-label={`Bento kart ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
      {/* ============================
          FEATURES ZIG-ZAG SECTION
          ============================ */}
      <section id="features" className="relative py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Daha az dağınıklık, daha verimli operasyon yönetimi"
            desc="Kulüp360 ile topluluğunuzun görev, yoklama ve katkı süreçlerini tek akışta yönetin; tekrar eden manuel iş yükünü ortadan kaldırın."
          />

          {/* Desktop View: Zig-zag alternating layout */}
          <div className="hidden lg:block mt-16 sm:mt-24 space-y-24 lg:space-y-36">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const featureScreens = ['attendance', 'tasks', 'dashboard', 'leaderboard'];
              const isEven = index % 2 === 0;

              return (
                <div
                  key={feature.title}
                  className="scroll-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 lg:py-10"
                >
                  {/* Text Column */}
                  <div
                    className={`lg:col-span-5 flex flex-col justify-center text-center lg:text-left ${
                      isEven ? 'lg:order-first' : 'lg:order-last'
                    }`}
                  >
                    <span className="self-center lg:self-start inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b31d27] dark:text-[#b31d27] mb-6">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b31d27]"></span>
                      </span>
                      <span>{feature.tag}</span>
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white lt-text-heading font-clash tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-5 text-base sm:text-lg leading-relaxed text-gray-400 lt-text-body">
                      {feature.desc}
                    </p>
                    <div className="mt-8 space-y-4">
                      {feature.benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-4 justify-center lg:justify-start">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#b31d27]/10 border border-[#b31d27]/20">
                            <CheckCircle className="h-3.5 w-3.5 text-[#b31d27]" />
                          </div>
                          <span className="text-base text-gray-300 lt-text-body font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mockup Column */}
                  <div
                    className={`lg:col-span-7 flex justify-center items-center relative ${
                      isEven ? 'lg:order-last' : 'lg:order-first'
                    }`}
                  >
                    {/* Glow effect behind mockup */}
                    <div className="absolute -inset-4 bg-[#b31d27]/5 dark:bg-[#b31d27]/5 blur-3xl -z-10 rounded-[3rem]"></div>
                    
                    <div 
                      className="w-full max-w-2xl framer-mockup-frame p-2 backdrop-blur-2xl relative ring-1 ring-white/10"
                    >
                      {/* Window header */}
                      <div className="flex items-center gap-2 px-3 pb-3 pt-2 mb-2 border-b border-white/5 bg-white/[0.02]">
                        <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                        <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <div className="overflow-hidden rounded-b-xl bg-[#0a0a0a]">
                        {index === 0 && <QrYoklamaMockup />}
                        {index === 1 && <GorevHavuzuMockup />}
                        {index === 2 && <KanbanMockup />}
                        {index === 3 && <SiralamaMockup />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile View: Premium Tabbed Simulator */}
          <div className="block lg:hidden mt-8 w-full mobile-simulator-wrapper">
            {/* Tab Switched Header buttons */}
            <div className="flex items-center justify-between gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl mb-6 relative overflow-hidden backdrop-blur-xl">
              {features.map((feat, idx) => {
                const TabIcon = feat.icon;
                return (
                  <button
                    key={feat.tag}
                    type="button"
                    onClick={() => setActiveFeatureTab(idx)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all duration-300 relative z-10 ${
                      activeFeatureTab === idx
                        ? 'text-white bg-[#b31d27] shadow-lg shadow-[#b31d27]/20'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <TabIcon className="h-4.5 w-4.5" />
                    <span>{feat.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Premium Simulator Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f]/80 p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Glow background */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#b31d27]/5 blur-2xl rounded-full" />
              
              <div className="relative z-10 flex flex-col gap-4">
                {/* Feature details */}
                <div className="text-left">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#b31d27] mb-2">
                    <span className="h-1 w-1 rounded-full bg-[#b31d27]" />
                    <span>{features[activeFeatureTab].tag}</span>
                  </span>
                  <h3 className="text-lg font-clash font-bold text-white leading-snug">
                    {features[activeFeatureTab].title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {features[activeFeatureTab].desc}
                  </p>
                </div>

                {/* Micro-Simulator container */}
                <div className="rounded-xl border border-white/5 bg-[#080808] overflow-hidden h-auto flex flex-col justify-between">
                  {activeFeatureTab === 0 && <QrYoklamaMockup />}
                  {activeFeatureTab === 1 && <GorevHavuzuMockup />}
                  {activeFeatureTab === 2 && <KanbanMockup />}
                  {activeFeatureTab === 3 && <SiralamaMockup />}
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* ============================
          HOW IT WORKS TIMELINE
          ============================ */}
      <section ref={timelineRef} id="how-it-works" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Kulüp360 nasıl çalışır?"
            desc="Toplantı fikrinden dönem sonu raporuna kadar tüm süreçler, topluluk yönetimini sadeleştiren dört adımda ilerler."
          />

          {/* Workflow Grid */}
          <div className="mt-16 sm:mt-24 relative timeline-wrap">
            <div className="timeline-grid grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative scroll-reveal group">
                    {/* Card container */}
                    <div 
                      onMouseEnter={() => setHoveredStep(step.id)}
                      onMouseLeave={() => setHoveredStep(null)}
                      onMouseMove={handleCardMouseMove}
                      onClick={() => setHoveredStep(hoveredStep === step.id ? null : step.id)}
                      className="timeline-card w-full premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[295px] flex flex-col justify-between items-start text-left bg-white/5 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 hover:border-[#b31d27]/40 dark:hover:border-[#b31d27]/30 transition-all duration-300 cursor-pointer select-none active:scale-[0.99] sm:active:scale-100"
                    >
                      <div className="bento-card-spotlight" />
                      <div>
                        {/* Step Number Background */}
                        <span className="text-[5rem] font-bold font-clash text-[#b31d27]/[0.05] dark:text-[#b31d27]/[0.04] absolute right-4 top-0 select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 step-number-watermark">
                          {step.id}
                        </span>

                        {/* Icon */}
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b31d27]/10 border border-[#b31d27]/20 text-[#b31d27] dark:text-[#b31d27] mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <Icon className="h-5 w-5 stroke-[1.8]" />
                        </div>

                        {/* Content */}
                        <h4 className="text-base font-bold text-white lt-text-heading font-clash mb-2.5">
                          {step.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-gray-400 lt-text-body">
                          {step.desc}
                        </p>
                      </div>

                      {/* Interactive visual cues */}
                      {step.id === '01' && (
                        <div className={`timeline-visual-cue w-full mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] text-gray-400 transition-all duration-500 ${hoveredStep === '01' ? 'opacity-100 translate-y-0 scale-102 border-[#b31d27]/30' : 'opacity-60 translate-y-1'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-[8px] uppercase tracking-wider">Etkinlik Taslağı</span>
                            <span className="text-[#b31d27] font-bold">%66 Tamam</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-400">✓ <span>Etkinlik Gündemi</span></div>
                            <div className="flex items-center gap-1.5 text-emerald-400">✓ <span>Tarih & Mekan</span></div>
                            <div className="flex items-center gap-1.5 text-gray-500">○ <span>Görev Dağıtımı</span></div>
                          </div>
                        </div>
                      )}

                      {step.id === '02' && (
                        <div className={`timeline-visual-cue w-full mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] text-gray-400 transition-all duration-500 ${hoveredStep === '02' ? 'opacity-100 translate-y-0 scale-102 border-[#b31d27]/30' : 'opacity-60 translate-y-1'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-[8px] uppercase tracking-wider">Katılım Terminali</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="h-4 w-4 bg-[#b31d27]/20 border border-[#b31d27]/30 rounded flex items-center justify-center text-[7px] text-white font-bold">QR</div>
                              <span>Duran G. okuttu</span>
                            </div>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold transition-all duration-500 ${hoveredStep === '02' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                              {hoveredStep === '02' ? '✓ Doğrulandı' : 'Bekleniyor'}
                            </span>
                          </div>
                        </div>
                      )}

                      {step.id === '03' && (
                        <div className={`timeline-visual-cue w-full mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] text-gray-400 transition-all duration-500 ${hoveredStep === '03' ? 'opacity-100 translate-y-0 scale-102 border-[#b31d27]/30' : 'opacity-60 translate-y-1'}`}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-white text-[8px] uppercase tracking-wider">İş Dağılımı</span>
                            <span className="text-gray-500">1 Görev</span>
                          </div>
                          <div className="relative h-6 bg-white/[0.02] border border-white/5 rounded flex items-center px-1.5 overflow-hidden">
                            <div className={`h-4 bg-[#b31d27]/20 border border-[#b31d27]/30 rounded text-[7px] font-bold text-[#fca5a5] px-1.5 flex items-center gap-1 absolute transition-all duration-[750ms] ${hoveredStep === '03' ? 'left-[45%] bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'left-[5%]'}`}>
                              <span>{hoveredStep === '03' ? '✓ Benim İşim' : 'Açık Görev'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {step.id === '04' && (
                        <div className={`timeline-visual-cue w-full mt-3 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] text-gray-400 transition-all duration-500 ${hoveredStep === '04' ? 'opacity-100 translate-y-0 scale-102 border-[#b31d27]/30' : 'opacity-60 translate-y-1'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-[8px] uppercase tracking-wider">Katkı Liderliği</span>
                            <Trophy className={`h-3 w-3 transition-transform duration-500 ${hoveredStep === '04' ? 'text-amber-400 scale-125 rotate-12' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span>3. Duran G. (DevOps)</span>
                            <span className="font-mono text-white font-bold transition-all duration-500">
                              {hoveredStep === '04' ? '320 P -> 370 P' : '320 P'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flow arrow connector between cards (only on desktop lg) */}
                    {index < 3 && (
                      <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+16px)] -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center text-gray-500 transition-all duration-300 pointer-events-none group-hover:text-[#b31d27] group-hover:scale-110">
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          AUDIENCE SECTION
          ============================ */}
      <section id="audience" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Kulüp360 kimler içindir?"
            desc="Yönetim kurulu, komite liderleri veya üyeler; her rol için özel yetkilendirme sistemi sayesinde herkes yalnızca kendi süreçlerini görür ve yönetir."
          />

          {/* Tab Switcher */}
          <div className="audience-tabs scroll-reveal mt-12 flex justify-center">
            <div className="inline-flex rounded-2xl bg-white/[0.03] p-1.5 border border-white/10 relative">
              {/* Sliding background pill indicator */}
              <span
                className="absolute bg-white/10 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] audience-tab-indicator"
                style={{
                  left: `${audienceTabStyle.left}px`,
                  width: `${audienceTabStyle.width}px`,
                  top: '6px',
                  bottom: '6px',
                }}
              />
              {audienceCards.map((card, idx) => (
                <button
                  key={card.title}
                  ref={(el) => (audienceTabRefs.current[idx] = el)}
                  type="button"
                  onClick={() => setActiveAudienceTab(idx)}
                  className={`relative px-2.5 xs:px-4 sm:px-6 py-2.5 text-[10px] xs:text-xs sm:text-sm font-bold rounded-xl transition-all z-10 ${
                    activeAudienceTab === idx ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {card.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Card */}
          <div className="audience-card-wrap mt-8 max-w-2xl mx-auto">
            {(() => {
              const card = audienceCards[activeAudienceTab];
              const Icon = card.icon;
              return (
                <div key={activeAudienceTab} className="audience-card scroll-reveal is-visible premium-glass-card rounded-2xl p-6 sm:p-8 slide-entry-active">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white lt-text-heading font-clash">{card.title}</h3>
                      <p className="mt-0.5 text-sm text-gray-400 lt-text-body">{card.desc}</p>
                    </div>
                  </div>
                  
                  <div className="audience-highlights grid gap-3 sm:grid-cols-2">
                    {card.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                        <span className="text-sm text-gray-300 lt-text-body">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini Dashboard Simulator */}
                  <div className="audience-simulator mt-6 border-t border-white/5 pt-6 w-full">
                    <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">
                      <Sparkles className="h-3 w-3 text-red-500 animate-pulse" />
                      <span>Canlı Rol Simülatörü</span>
                    </div>

                    {/* President View */}
                    {activeAudienceTab === 0 && (
                      <div className="rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 slide-entry-active">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Başkan Onay Havuzu</span>
                          <span className="text-[9px] text-red-400 font-bold">2 Onay Bekleyen Talep</span>
                        </div>
                        <div className="space-y-2">
                          {presidentApprovals.map(app => (
                            <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 sm:py-2 text-xs border border-white/5 transition-all">
                              <div>
                                <span className="text-white font-medium block sm:inline">{app.title} </span>
                                <span className="text-[10px] text-gray-400">({app.type} - {app.committee})</span>
                              </div>
                              <div className="mt-3 sm:mt-0 flex gap-2 w-full sm:w-auto">
                                {app.status === 'pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPresidentApprovals(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                        setBentoXpScore(p => p + 15);
                                        triggerXpParticle('+15');
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-[9px] font-bold px-3 py-1.5 sm:px-2 sm:py-1 rounded flex-1 sm:flex-none text-center active:scale-[0.97] transition-all"
                                    >
                                      Onayla
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPresidentApprovals(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
                                      }}
                                      className="bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] sm:text-[9px] font-bold px-3 py-1.5 sm:px-2 sm:py-1 rounded border border-white/10 flex-1 sm:flex-none text-center active:scale-[0.97] transition-all"
                                    >
                                      Reddet
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-bold text-center w-full sm:w-auto ${app.status === 'approved' ? 'text-emerald-400' : 'text-gray-500'}`}>
                                    {app.status === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-[9px] text-gray-500">Komitelerden gelen proje ve etkinlik taleplerini denetleyin.</span>
                          {presidentApprovals.some(a => a.status !== 'pending') && (
                            <button
                              type="button"
                              onClick={() => setPresidentApprovals([
                                { id: 1, title: 'Mobil Uygulama Geliştirme', type: 'Proje', committee: 'DevOps Ekibi', status: 'pending' },
                                { id: 2, title: 'Tanışma ve Oryantasyon Günü', type: 'Etkinlik', committee: 'Etkinlik Komitesi', status: 'pending' }
                              ])}
                              className="text-[9px] text-red-400 font-bold hover:underline"
                            >
                              Sıfırla
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Leader View */}
                    {activeAudienceTab === 1 && (
                      <div className="rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 slide-entry-active">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Komite Liderliği Arayüzü</span>
                          <span className="text-[9px] text-red-400 font-bold">Hızlı Görev Havuzu</span>
                        </div>
                        <div className="space-y-3">
                          {/* Task List */}
                          <div className="space-y-1.5">
                            {leaderTasks.map(t => (
                              <div key={t.id} className="flex justify-between items-center rounded-lg bg-white/5 px-3 py-2 text-xs border border-white/5 slide-entry-active">
                                <span className="text-white font-medium">{t.title}</span>
                                <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                  {t.cat}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Quick Create Button */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const titles = [
                                  'Afiş Tasarımı Hazırla',
                                  'Sponsorluk Sunumu Güncelle',
                                  'Yazılım Dockerization Çalışması',
                                  'Haftalık Bülten Hazırlığı'
                                ];
                                const cats = ['Tasarım', 'Sponsorluk', 'DevOps', 'İçerik'];
                                const randIdx = Math.floor(Math.random() * titles.length);
                                const newTask = {
                                  id: Date.now(),
                                  title: titles[randIdx],
                                  cat: cats[randIdx],
                                  status: 'created'
                                };
                                setLeaderTasks(prev => [...prev, newTask].slice(-3));
                                setBentoXpScore(p => p + 20);
                                triggerXpParticle('+20');
                              }}
                              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10 active:scale-[0.97]"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              <span className="hidden xs:inline">+ Hızlı Görev Havuzuna Ekle (+20 Katkı Puanı)</span>
                              <span className="xs:hidden">Görev Ekle (+20 Puan)</span>
                            </button>
                            {leaderTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setLeaderTasks([{ id: 1, title: 'Discord Sunucusu Konfigürasyonu', cat: 'DevOps', status: 'created' }])}
                                className="bg-white/5 hover:bg-white/10 text-gray-400 text-xs px-2.5 rounded-lg border border-white/10"
                              >
                                Sıfırla
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Member View */}
                    {activeAudienceTab === 2 && (
                      <div className="rounded-xl border border-white/5 bg-black/40 dark:bg-black/60 p-4 slide-entry-active">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Üye Katkı Özeti</span>
                          <span className="text-[9px] text-emerald-400 font-bold font-mono">Aylık Puan</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex justify-between text-xs font-bold text-white">
                              <span>Sen (Duran G.)</span>
                              <span className="text-red-400">DevOps Lider Yrd.</span>
                            </div>
                            
                            {/* XP Progress Bar */}
                            <div className="relative">
                              <div className="h-3 overflow-hidden rounded-full bg-white/5 border border-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500" style={{ width: `${(memberXp / 500) * 100}%` }} />
                              </div>
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white leading-none font-mono">
                                {memberXp} / 500 Puan
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!memberClaimed) {
                                setMemberXp(p => Math.min(500, p + 60));
                                setMemberClaimed(true);
                                setBentoXpScore(p => p + 30);
                                triggerXpParticle('+30');
                              }
                            }}
                            disabled={memberClaimed}
                            className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all w-full sm:w-auto text-center active:scale-[0.97] ${
                              memberClaimed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10'
                            }`}
                          >
                            {memberClaimed ? (
                              'Katkı Alındı ✓'
                            ) : (
                              <>
                                <span className="hidden xs:inline">Aylık Katkı Bonusu Al (+60 Katkı Puanı)</span>
                                <span className="xs:hidden">Bonus Al (+60 Puan)</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center font-clash">
                          <div className="flex gap-2">
                            <span className="text-[9px] border border-white/5 bg-white/5 rounded px-2 py-0.5 text-gray-400 font-bold uppercase">
                              Linux / Docker
                            </span>
                            <span className="text-[9px] border border-white/5 bg-white/5 rounded px-2 py-0.5 text-gray-400 font-bold uppercase">
                              Tasarım / UI
                            </span>
                          </div>
                          {memberClaimed && (
                            <button
                              type="button"
                              onClick={() => {
                                setMemberXp(340);
                                setMemberClaimed(false);
                              }}
                              className="text-[9px] text-red-400 font-bold hover:underline"
                            >
                              Sıfırla
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ============================
          SCREEN PREVIEWS
          ============================ */}
      <section id="screens" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Yönetici ve üye arayüzlerini keşfedin"
            desc="Kulüp360'ın modern ve hızlı yönetim panellerini, gerçek ekran görüntüleri ve entegre sistem özellikleri üzerinden adım adım inceleyin."
          />

          {/* 2-Column Layout: Details on left, Browser Showcase on right */}
          <div className="screens-showcase-grid mt-12 grid gap-8 lg:grid-cols-5 items-center">
            {/* Left Column: Spacious Details Panel */}
            <div className={`hidden lg:flex lg:col-span-2 flex-col justify-center min-h-[300px] scroll-reveal transition-all duration-300 ${
              isScreenTransitioning 
                ? 'opacity-0 -translate-y-2 scale-[0.98] blur-[2px]' 
                : 'opacity-100 translate-y-0 scale-100 blur-0'
            }`}>
              {(() => {
                const screen = screenPreviews.find((s) => s.id === activeScreenTab);
                const Icon = screen.icon;
                return (
                  <div className="space-y-6">
                    <div>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b31d27]/10 border border-[#b31d27]/20 text-[#b31d27] mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl sm:text-3.5xl font-bold text-white lt-text-heading font-clash tracking-wide">{screen.title}</h3>
                      <p className="mt-3 text-sm text-gray-400 lt-text-body leading-relaxed max-w-md">
                        {screen.desc}
                      </p>
                    </div>
                    
                    <div className={`space-y-2.5 pt-5 border-t ${
                      isLightTheme ? 'border-slate-200/50' : 'border-white/5'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                        isLightTheme ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        SİSTEM ÖZELLİKLERİ
                      </span>
                      {screen.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-start gap-2.5">
                          <CheckCircle className="h-4 w-4 text-[#b31d27] mt-0.5 flex-shrink-0" />
                          <span className={`text-xs font-semibold lt-text-body ${
                            isLightTheme ? 'text-slate-700' : 'text-gray-300'
                          }`}>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Sticky Browser Showcase Mockup */}
            <div className={`lg:col-span-3 lg:sticky lg:top-28 scroll-reveal transition-all duration-300 ${
              isScreenTransitioning 
                ? 'opacity-0 translate-y-2 scale-[0.98] blur-[2px]' 
                : 'opacity-100 translate-y-0 scale-100 blur-0'
            }`}>
              {(() => {
                const screen = screenPreviews.find((s) => s.id === activeScreenTab);
                return (
                  <div className="w-full product-frame p-2 backdrop-blur-2xl relative ring-1 ring-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0b0b0b]">
                    {/* Window Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 px-2 mb-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono select-none">
                        kulup360.com/portal/{screen.id}
                      </div>
                      <div className="w-10" />
                    </div>

                    {/* Screenshot Container */}
                    <div className="relative group overflow-hidden rounded-lg bg-black cursor-zoom-in">
                      <img 
                        src={screen.image} 
                        alt={screen.title} 
                        className="screen-preview-image w-full h-auto object-cover max-h-[380px] sm:max-h-[500px] opacity-90 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-103"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none opacity-60" />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Mobile-Only Selection Banner */}
            <div className={`screen-mobile-banner block lg:hidden p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
              isLightTheme 
                ? 'bg-slate-50/85 border-slate-200/80 shadow-slate-200/30' 
                : 'bg-white/[0.02] border-white/5'
            } ${
              isScreenTransitioning 
                ? 'opacity-0 translate-y-2 scale-[0.98] blur-[2px]' 
                : 'opacity-100 translate-y-0 scale-100 blur-0'
            }`}>
              {(() => {
                const screen = screenPreviews.find((s) => s.id === activeScreenTab);
                const Icon = screen.icon;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#b31d27]/10 border border-[#b31d27]/20 text-[#b31d27]">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-base font-bold text-white lt-text-heading font-clash">{screen.title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 lt-text-body leading-relaxed">
                      {screen.desc}
                    </p>
                    <div className={`space-y-2 pt-3 border-t ${
                      isLightTheme ? 'border-slate-200/50' : 'border-white/5'
                    }`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                        isLightTheme ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        SİSTEM ÖZELLİKLERİ
                      </span>
                      {screen.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-start gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-[#b31d27] mt-0.5 flex-shrink-0" />
                          <span className={`text-[11px] font-semibold lt-text-body ${
                            isLightTheme ? 'text-slate-700' : 'text-gray-300'
                          }`}>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Interactive Mac-Style Glass Dock (Centered at bottom) */}
          <div className="screens-dock mt-4 flex justify-center scroll-reveal relative w-full overflow-hidden">
            {/* Left fade overlay */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 z-20 pointer-events-none transition-opacity duration-300 sm:hidden ${
              isLightTheme
                ? 'bg-gradient-to-r from-[#fafaf9] to-transparent'
                : 'bg-gradient-to-r from-[#080808] to-transparent'
            }`} />
            
            {/* Right fade overlay */}
            <div className={`absolute right-0 top-0 bottom-0 w-8 z-20 pointer-events-none transition-opacity duration-300 sm:hidden ${
              isLightTheme
                ? 'bg-gradient-to-l from-[#fafaf9] to-transparent'
                : 'bg-gradient-to-l from-[#080808] to-transparent'
            }`} />

            <div className={`flex items-end justify-start sm:justify-center gap-2.5 sm:gap-4 rounded-3xl p-3 shadow-2xl border backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full relative z-10 ${
              isLightTheme
                ? 'bg-slate-50/80 border-slate-200/80 shadow-slate-200/30'
                : 'bg-white/[0.02] border-white/10 shadow-black/40'
            }`}>
              {screenPreviews.map((screen) => {
                const Icon = screen.icon;
                const isActive = activeScreenTab === screen.id;
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => handleScreenTabChange(screen.id)}
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border transition-all duration-300 hover:scale-120 hover:-translate-y-2.5 cursor-pointer relative group flex-shrink-0 ${
                      isLightTheme
                        ? isActive
                          ? 'bg-[#b31d27]/10 border-[#b31d27]/30 text-[#b31d27]'
                          : 'bg-white border-slate-200/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        : isActive
                          ? 'bg-[#b31d27]/15 border-[#b31d27]/40 text-white shadow-lg shadow-[#b31d27]/10'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6 transition-transform duration-300" />
                    
                    {/* Tooltip */}
                    <span className={`absolute -top-10 left-1/2 -translate-x-1/2 text-[11px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border ${
                      isLightTheme
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-black/90 border-white/10 text-white'
                    }`}>
                      {screen.title}
                    </span>

                    {/* Active Indicator Dot */}
                    {isActive && (
                      <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isLightTheme
                          ? 'bg-[#b31d27]'
                          : 'bg-[#b31d27] shadow-[0_0_8px_#b31d27]'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          STATS SECTION
          ============================ */}
      <section ref={statsRef} className="relative hidden lg:block py-16 sm:py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat) => {
              const count = useCountUp(stat.value, statsVisible);
              return (
                <div key={stat.label} className="scroll-reveal text-center">
                  <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-clash text-white lt-text-heading">
                    {count}
                    <span className="text-red-400">{stat.suffix}</span>
                  </div>
                  <div className="mt-1.5 sm:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 lt-text-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================
          TRUST SECTION
          ============================ */}
      <section id="trust" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mobile-trust-stats lg:hidden grid grid-cols-4 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.03] px-2 py-2 text-center">
                <div className="text-sm font-clash text-white lt-text-heading">
                  {stat.value}
                  <span className="text-red-400">{stat.suffix}</span>
                </div>
                <div className="mt-0.5 text-[8px] leading-tight text-gray-500 lt-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
          <SectionHeading
            title="Güvenli altyapı ve kontrollü veri erişimi"
            desc="Rol bazlı yetkilendirme, şifreli veri saklama ve kontrollü üye girişi ile topluluk verileriniz her zaman güvence altındadır."
          />

          <div className="mt-14 sm:mt-16 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 stagger-children">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="scroll-reveal premium-glass-card rounded-2xl p-4 sm:p-6 text-center group"
                >
                  <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl border border-[#b31d27]/20 bg-[#b31d27]/10 text-[#b31d27] mb-3 sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-left lg:text-center flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white lt-text-heading">{item.title}</h4>
                    <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs leading-relaxed text-gray-400 lt-text-body">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================
          FAQ SECTION
          ============================ */}
      <section id="faq" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Sıkça Sorulan Sorular"
            desc="Kulüp360 platformunun işleyişi, güvenliği ve kurulum süreçleri hakkında merak ettiklerinize hızlıca yanıt bulun."
          />

          <div className="mt-12 sm:mt-14 space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={item.q}
                className="scroll-reveal premium-glass-card rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 text-left"
                >
                  <span className="text-[13px] sm:text-base font-semibold text-white lt-text-heading pr-3 sm:pr-4">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 faq-chevron ${faqOpen === index ? 'is-open' : ''}`} />
                </button>
                <div className={`faq-answer ${faqOpen === index ? 'is-open' : ''}`}>
                  <div>
                    <p className="px-4 pb-4 sm:px-6 sm:pb-5 text-[13px] sm:text-sm leading-relaxed text-gray-400 lt-text-body">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          CONTACT / CTA SECTION
          ============================ */}
      <section id="contact" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 scroll-snap-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Topluluğunuzu bir üst seviyeye taşıyın"
            desc="Kulüp360'ı topluluğunuzda kullanmaya başlamak, demo süreçleri hakkında bilgi edinmek veya iletişime geçmek için formu doldurun."
          />

          {!isSubmitted ? (
            <form onSubmit={handleContactSubmit} className="contact-form scroll-reveal mt-12 premium-glass-card rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 lt-text-muted mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b31d27]/50 focus:ring-1 focus:ring-[#b31d27]/20 transition-all lt-bg-card"
                    placeholder="İsminiz ve Soyisminiz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 lt-text-muted mb-2">E-posta</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b31d27]/50 focus:ring-1 focus:ring-[#b31d27]/20 transition-all lt-bg-card"
                    placeholder="ornek.posta@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 lt-text-muted mb-2">Topluluk / Kulüp Adı</label>
                  <input
                    type="text"
                    required
                    value={contactForm.club}
                    onChange={(e) => setContactForm({ ...contactForm, club: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b31d27]/50 focus:ring-1 focus:ring-[#b31d27]/20 transition-all lt-bg-card"
                    placeholder="Örn: Girişimcilik Topluluğu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 lt-text-muted mb-2">Üniversite / Organizasyon</label>
                  <input
                    type="text"
                    required
                    value={contactForm.university}
                    onChange={(e) => setContactForm({ ...contactForm, university: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b31d27]/50 focus:ring-1 focus:ring-[#b31d27]/20 transition-all lt-bg-card"
                    placeholder="Örn: İnönü Üniversitesi"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 lt-text-muted mb-2">Mesajınız</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#b31d27]/50 focus:ring-1 focus:ring-[#b31d27]/20 transition-all resize-none lt-bg-card"
                  placeholder="Platformumuz hakkında sormak istediklerinizi veya demo talebinizin detaylarını yazabilirsiniz..."
                />
              </div>
              <button
                type="submit"
                className="lt-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#b31d27] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#961820] transition-all shadow-md shadow-black/20"
              >
                Demo Talebini Gönder <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="scroll-reveal is-visible mt-12 premium-glass-card rounded-2xl p-8 sm:p-12 text-center slide-entry-active">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-clash lt-text-heading">Talebiniz Alındı!</h3>
              <p className="mt-3 text-sm text-gray-400 lt-text-body max-w-md mx-auto">
                Demo ve iletişim talebiniz başarıyla kaydedilmiştir. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================
          FOOTER
          ============================ */}
      <footer className="landing-footer relative border-t border-white/5 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2 text-center sm:text-left">
              <img src={kulupLogo} alt="Kulüp360" className="h-10 sm:h-12 mb-4 brightness-0 invert mx-auto sm:mx-0" />
              <p className="text-xs sm:text-sm text-gray-500 lt-text-body max-w-sm leading-relaxed mx-auto sm:mx-0">
                Toplulukların iç operasyonlarını tek merkezden yöneten dijital yönetim platformu. Etkinlik, görev, yoklama, üye ve katkı süreçlerini tek panelde yönetin.
              </p>
            </div>

            {/* Links */}
            <div className="text-center sm:text-left">
              <h5 className="text-xs font-bold uppercase text-gray-500 lt-text-muted mb-4 tracking-wider">Platform</h5>
              <div className="space-y-2.5">
                {[
                  { href: '#features', label: 'Özellikler' },
                  { href: '#how-it-works', label: 'Nasıl Çalışır' },
                  { href: '#audience', label: 'Kim İçin' },
                  { href: '#trust', label: 'Güvenlik' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-gray-400 hover:text-white transition-colors lt-text-body"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="text-center sm:text-left">
              <h5 className="text-xs font-bold uppercase text-gray-500 lt-text-muted mb-4 tracking-wider">İletişim</h5>
              <div className="space-y-2.5">
                <a href="#contact" className="block text-sm text-gray-400 hover:text-white transition-colors lt-text-body">
                  Demo Talep Et
                </a>
                <a href="#faq" className="block text-sm text-gray-400 hover:text-white transition-colors lt-text-body">
                  SSS
                </a>
                <span className="block text-sm text-gray-500 lt-text-muted">iletisim@kulup360.com</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs text-gray-500 lt-text-muted">
              © {new Date().getFullYear()} Kulüp360. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 lt-text-muted">
              <Star className="h-3 w-3 text-[#b31d27]" />
              DevOps Geliştirici Ekibi tarafından geliştirildi
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 bg-[#b31d27] hover:bg-[#961820] hover:scale-110 p-3 rounded-full shadow-md shadow-black/20 transition-all duration-300 text-white cursor-pointer"
          aria-label="Yukarı git"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
