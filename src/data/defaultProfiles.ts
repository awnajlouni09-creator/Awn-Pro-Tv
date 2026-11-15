import { UserProfile } from '../types/profile';
import fallbackKidsAvatar from '../assets/images/cartoon_lion_1794516444582.jpg';

export interface ProfileAvatarOption {
  id: string;
  label: string;
  url: string;
  fallbackUrl: string;
  color: string;
}

export const AVAILABLE_AVATARS: ProfileAvatarOption[] = [
  {
    id: 'nflx-avatar-01',
    label: 'شخصية 1',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABTk6nphithdqaDreuMsv-yBIzn5xmqqPyz35rHfxkU78C5oD_iRonk_v4jEoZq0U5XFq2c8Qn3phI_uchLj9PKfzFWHgA_QaHw.png?r=201',
    fallbackUrl: fallbackKidsAvatar,
    color: '#E50914'
  },
  {
    id: 'nflx-avatar-02',
    label: 'شخصية 2',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABfsoRr7wu3nuNyVyvsJCa0OjjALmRjEuTQav1MNcu6b6FNcjCPYpkqPhZb3n-H-ZRfTho8hSPQCywoFEyoqKFrGSy6t2C9u6hg.png?r=7c7',
    fallbackUrl: fallbackKidsAvatar,
    color: '#2563eb'
  },
  {
    id: 'nflx-avatar-03',
    label: 'شخصية 3',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABU33FxqXq2FsdoOxl4vEBj4GdQVSzVrfICohGXxHrtfbZku_y1MQzzxyxsME0A0o0916vAK5sam4yVYZzYlTE9L8dd8DJzQaPA.png?r=eea',
    fallbackUrl: fallbackKidsAvatar,
    color: '#f59e0b'
  },
  {
    id: 'nflx-avatar-04',
    label: 'شخصية 4',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABUt3s4fnzIn5ns3Gt3KWxAuh1_qHn3coUijlWER1PzTOnXELAcN7rUAEkFRcL078AIgAHRz6luD7WXS_X4p_vnechHooWlQ8pA.png?r=e6e',
    fallbackUrl: fallbackKidsAvatar,
    color: '#10b981'
  },
  {
    id: 'nflx-avatar-05',
    label: 'شخصية 5',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABQu1YUjPCFcAl05eppFA9cUOWrYN1etuI3Z2YZYvyoW27NwqYxsqZFYhHXYs9RSurz9t9yiA49Sp18nKd72I818YSBxav9vtig.png?r=bd7',
    fallbackUrl: fallbackKidsAvatar,
    color: '#8b5cf6'
  },
  {
    id: 'nflx-avatar-06',
    label: 'شخصية 6',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABZW9CLr7djFonhH5HdAhJFcOAmQwudQQgQtwxu3_lRsUIW1DlbQdMoKlDJrPZvwJBOK7gAjMspygddLS-uYxqTgwiLX3iHF0Rg.png?r=1d4',
    fallbackUrl: fallbackKidsAvatar,
    color: '#06b6d4'
  },
  {
    id: 'nflx-avatar-07',
    label: 'شخصية 7',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABRcwVT9terBq8TE65MdZqQWoXv1aZlb3CGn0x4qfHV0oO2ymtjUuNRAgqnkQaCnfBvFTGjdB69nF3uKyexHcAF8iNxa7KEhXwg.png?r=54c',
    fallbackUrl: fallbackKidsAvatar,
    color: '#ec4899'
  },
  {
    id: 'nflx-avatar-08',
    label: 'شخصية 8',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABXli9bamOnnST26H043uYKkkefr6WN0AVYhmTydy9Zn4H5hxNUuSXILHtzwIC5NuddX6IrkrWK26jS0obzOC24Ar6sVXhI9GHQ.png?r=a02',
    fallbackUrl: fallbackKidsAvatar,
    color: '#f97316'
  },
  {
    id: 'nflx-avatar-09',
    label: 'شخصية 9',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABTcWe5qN07E7wsevA_D12WuS68PnSbhnTzjcEB1vmrIlRKv5gJZlAgCUsemY41g2Z58yomtk369TGD2dzMjceJEwZUlVaICInQ.png?r=2e3',
    fallbackUrl: fallbackKidsAvatar,
    color: '#14b8a6'
  },
  {
    id: 'nflx-avatar-10',
    label: 'شخصية 10',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABTisfT0DblH1RXe6C29gdnPV2BS78f2v0io32YBpNubTAueb7vPNEh0gRPtnuKzCtHCvNePCE3Ky6eHU5D8sqB89l5QV2keSlw.png?r=7e3',
    fallbackUrl: fallbackKidsAvatar,
    color: '#6366f1'
  },
  {
    id: 'nflx-avatar-11',
    label: 'شخصية 11',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABeQ-wQ87v4G7odLIB839LRW_zHCfeqTthD9Z2ht18oVm_SsJxH3OmvCPnmrirEJTYfjS32hes4mjrAFY1tcJxgNIzYjfveMUiw.png?r=cfc',
    fallbackUrl: fallbackKidsAvatar,
    color: '#ef4444'
  },
  {
    id: 'nflx-avatar-12',
    label: 'شخصية 12',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABTVnvTAihcpQIOsWdDnthn1AKpon0nQJ9iYP4FHmAXJFDQ_emiJQhwYlh_-ofpgNsmVZd1MKKDXoeYiYd2N-D_BFqSf_z6agBw.png?r=104',
    fallbackUrl: fallbackKidsAvatar,
    color: '#3b82f6'
  },
  {
    id: 'nflx-avatar-13',
    label: 'شخصية 13',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABfaVOYskVDLesV38BhgMMVGawe0TaS4DFV-41OeeXSYFweeRu0jaeOJ04YRTHtu__5p2zv6m42vG9kUF81BaqE5mpOZ9deVBeA.png?r=88c',
    fallbackUrl: fallbackKidsAvatar,
    color: '#eab308'
  },
  {
    id: 'nflx-avatar-14',
    label: 'شخصية 14',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABftjWk6Kc2S8-tAu1ra7uV8Gk21Jby9sbN8iUxw5l2A2MDRzN-QXflPl2PhM35KfCTFX64_H_2vvnKcpjbmVB733BHgwc375YA.png?r=66c',
    fallbackUrl: fallbackKidsAvatar,
    color: '#22c55e'
  },
  {
    id: 'nflx-avatar-15',
    label: 'شخصية 15',
    url: 'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABf2s-1Io32oCm_lRVy3YNLu2V7SsU3TSmyk0N6jel0YjlX3__uLFcKpjsH-P6bgym2BNtC491vUJK2TnD3OAl7qPpzT7vtn2dQ.png?r=0b0',
    fallbackUrl: fallbackKidsAvatar,
    color: '#a855f7'
  }
];

export const DEFAULT_KIDS_EXIT_PIN = '6767';

export const DEFAULT_KIDS_AVATAR_URL =
  'https://occ-0-9457-2706.1.nflxso.net/dnm/api/v6/SO2HoVCx33X8phZh2pZZmQ4QgNY/AAAABaqChUAcjwwPCeVu-pInCoRtiBZ_Wdcn9i9K7Mr8svoQZaeUC-NClfG0CeW0TTKnhMp_kF6Jc-gcX4NJiz483rGFBuRvELhpXw.png?r=ab6';

export const AVAILABLE_AVATARS_WITH_KIDS: ProfileAvatarOption[] = [
  ...AVAILABLE_AVATARS,
  {
    id: 'nflx-avatar-kids',
    label: 'الأطفال',
    url: DEFAULT_KIDS_AVATAR_URL,
    fallbackUrl: fallbackKidsAvatar,
    color: '#f59e0b'
  }
];

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'profile-kids',
    name: 'الأطفال',
    avatar: DEFAULT_KIDS_AVATAR_URL,
    isKids: true,
    pin: DEFAULT_KIDS_EXIT_PIN,
    bgColor: '#f59e0b',
    createdAt: 1700000001000
  }
];
