import { Channel } from '../types/iptv';
import { MaturityRating } from '../types/profile';

const MATURITY_ORDER: Record<MaturityRating, number> = {
  kids: 0,
  '7+': 1,
  '13+': 2,
  '16+': 3,
  '18+': 4
};

const KNOWN_FRANCHISES: Array<{ key: string; label: string; patterns: RegExp[] }> = [
  {
    key: 'transformers',
    label: 'سلسلة Transformers',
    patterns: [/transformers/i, /bumblebee/i, /بامبلبي/, /المتحولون/, /ترانسفورمرز/]
  },
  {
    key: 'shabab-al-bomb',
    label: 'سلسلة شباب البومب',
    patterns: [/شباب\s*البومب/]
  },
  {
    key: 'john-wick',
    label: 'سلسلة John Wick',
    patterns: [/john\s*wick/i, /جون\s*ويك/]
  },
  {
    key: 'spider-man',
    label: 'سلسلة Spider-Man',
    patterns: [/spider[-\s]*man/i, /سبايدر\s*مان/, /الرجل\s*العنكبوت/]
  },
  {
    key: 'fast-furious',
    label: 'سلسلة Fast & Furious',
    patterns: [/fast\s*(&|and)?\s*furious/i, /السرعة\s*والغضب/]
  },
  {
    key: 'blender-open-movies',
    label: 'أفلام الخيال والفانتازيا القصيرة 4K',
    patterns: [/sintel/i, /tears\s*of\s*steel/i, /big\s*buck/i, /سينتل/, /دموع\s*الفولاذ/]
  },
  {
    key: 'abu-sadiq',
    label: 'سلسلة وثائقيات أبو الصادق',
    patterns: [/أبو\s*الصادق/, /ابو\s*الصادق/]
  },
  {
    key: 'arab-news',
    label: 'شبكة القنوات الإخبارية المباشرة',
    patterns: [/الجزيرة/, /العربية/, /الحدث/, /الإخبارية/]
  }
];

export const getChannelMaturityRating = (channel: Channel): MaturityRating => {
  if (channel.maturityRating) {
    if (channel.maturityRating === 'عائلي') return 'kids';
    return channel.maturityRating;
  }
  if (channel.group === 'أطفال وكرتون' || channel.group === 'إسلاميات ودين') {
    return 'kids';
  }
  if (channel.group === 'أغاني وموسيقى' || channel.group === 'رياضة وسرعة') {
    return '7+';
  }
  if (
    channel.group === 'قصص واعترافات' ||
    channel.group === 'قصص وروايات' ||
    channel.group === 'وثائقيات أبو الصادق'
  ) {
    return '16+';
  }
  if (channel.group === 'أفلام أجنبية' && /حرب|رعب|دموي|war|extinction/i.test(channel.name)) {
    return '16+';
  }
  return '13+';
};

export const getMaturityBadgeLabel = (rating: MaturityRating): string => {
  switch (rating) {
    case 'kids':
      return 'عائلي';
    case '7+':
      return '+7';
    case '13+':
      return '+13';
    case '16+':
      return '+16';
    case '18+':
      return '+18';
  }
};

export const isChannelAllowedForRating = (
  channel: Channel,
  maxRating: MaturityRating = '18+'
): boolean => {
  const itemRating = getChannelMaturityRating(channel);
  return MATURITY_ORDER[itemRating] <= MATURITY_ORDER[maxRating];
};

export const getChannelYear = (channel: Channel): string => {
  if (channel.year) return channel.year;
  const yearMatch = `${channel.name} ${channel.description || ''}`.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) return yearMatch[1];

  if (channel.badge?.toUpperCase().includes('LIVE') || channel.badge?.includes('مباشر')) {
    return '2026';
  }
  if (channel.id.includes('bomb-14')) return '2026';
  if (channel.id.includes('bomb-13')) return '2025';
  if (channel.id.includes('bomb-12')) return '2024';
  if (channel.id.includes('bomb-11')) return '2023';
  if (channel.id.includes('bomb-10')) return '2022';
  if (channel.group === 'أفلام أجنبية') return '2024';
  return '2025';
};

export const getChannelDurationLabel = (channel: Channel, runtimeSeconds?: number): string => {
  if (channel.durationLabel) return channel.durationLabel;
  const secs = runtimeSeconds || channel.duration || 0;
  if (secs > 60) {
    const mins = Math.round(secs / 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} س ${m} د` : `${m} دقيقة`;
  }
  if (
    channel.url?.includes('.m3u8') ||
    channel.type === 'hls' ||
    channel.type === 'live' ||
    channel.badge?.toUpperCase().includes('LIVE') ||
    channel.badge?.includes('مباشر')
  ) {
    return 'بث مباشر 24/7';
  }
  if (channel.group === 'مسلسلات عربية') return 'موسم كامل · حلقات متعددة';
  if (channel.group === 'أفلام أجنبية') return '1 س 52 د';
  if (channel.group === 'ملخصات انمي') return '34 دقيقة';
  if (channel.group === 'وثائقي وطبيعة' || channel.group === 'وثائقيات أبو الصادق') return '48 دقيقة';
  return '45 دقيقة';
};

export const getChannelCast = (channel: Channel): string[] => {
  if (channel.cast && channel.cast.length > 0) return channel.cast;

  const desc = channel.description || '';
  const starringMatch = desc.match(/من بطولة\s+([^؛.،\n]+(?:و[^؛.،\n]+)?)/);
  if (starringMatch?.[1]) {
    const names = starringMatch[1]
      .split(/،|,|\s+و\s+|و(?=[^\s]{3,})/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    if (names.length > 0) return names.slice(0, 4);
  }

  if (channel.name.includes('شباب البومب')) {
    return ['فيصل العيسى', 'علي المدفع', 'مهند الجميلي', 'سليمان المقيطيب'];
  }
  if (/transformers|bumblebee|بامبلبي|المتحولون/i.test(channel.name)) {
    return ['هايلي ستاينفيلد', 'جون سينا', 'أوبتموس برايم', 'بيتر كولين'];
  }
  if (channel.group === 'أفلام أجنبية') {
    return ['بطولة نخبة نجوم هوليوود', 'أداء صوتي ومؤثرات سينمائية 4K'];
  }
  if (channel.group === 'مسلسلات عربية') {
    return ['نخبة نجوم الدراما العربية'];
  }
  if (channel.group === 'أطفال وكرتون') {
    return ['مدبلج للعربية · أصوات كرتون نتورك وسبستون'];
  }
  if (channel.group === 'وثائقي وطبيعة' || channel.group === 'وثائقيات أبو الصادق') {
    return ['فريق التحقيق والإعداد الوثائقي'];
  }
  return ['تقديم وبث مباشر على مدار الساعة'];
};

export const isMovieOrSeriesChannel = (channel: Channel): boolean => {
  if (channel.type === 'vod' || channel.type === 'local') return true;
  return (
    channel.group === 'أفلام أجنبية' ||
    channel.group === 'مسلسلات عربية' ||
    channel.group === 'ملخصات انمي' ||
    channel.group === 'قصص وروايات' ||
    channel.group === 'وثائقي وطبيعة' ||
    channel.group === 'وثائقيات أبو الصادق'
  );
};

export const detectChannelFranchise = (channel: Channel): { key: string; label: string } | null => {
  if (channel.collectionName) {
    return { key: channel.collectionName, label: channel.collectionName };
  }
  const haystack = `${channel.name} ${channel.description || ''}`;
  for (const franchise of KNOWN_FRANCHISES) {
    if (franchise.patterns.some((rx) => rx.test(haystack))) {
      return { key: franchise.key, label: franchise.label };
    }
  }

  // Automatic prefix matching before ":" or "-" or "الموسم" / "الجزء"
  const stem = channel.name
    .replace(/(فيلم|مسلسل|سلسلة|ملخص)\s+/g, '')
    .split(/[-:–|(]|الموسم|الجزء|part|season/i)[0]
    ?.trim();
  if (stem && stem.length >= 5) {
    return { key: `stem:${stem.toLowerCase()}`, label: `سلسلة ${stem}` };
  }
  return null;
};

export const getFranchiseAndRelatedChannels = (
  channel: Channel,
  allChannels: Channel[]
): {
  franchiseLabel: string | null;
  franchiseItems: Channel[];
  relatedItems: Channel[];
} => {
  const currentFranchise = detectChannelFranchise(channel);
  const franchiseItems: Channel[] = [];
  const relatedItems: Channel[] = [];

  for (const item of allChannels) {
    if (item.id === channel.id) continue;
    const itemFranchise = detectChannelFranchise(item);
    if (currentFranchise && itemFranchise && itemFranchise.key === currentFranchise.key) {
      franchiseItems.push(item);
    } else if (item.group === channel.group) {
      relatedItems.push(item);
    }
  }

  return {
    franchiseLabel: franchiseItems.length > 0 ? currentFranchise?.label || null : null,
    franchiseItems: franchiseItems.slice(0, 6),
    relatedItems: relatedItems.slice(0, 6)
  };
};
