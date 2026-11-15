#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
Awn Tv pro - رسيفر ذكي ومشغل وسائط متكامل (Windows Edition)
=============================================================================
تطبيق ريسيفر ذكي ومشغل وسائط متطور لأنظمة ويندوز (Windows)
يدعم:
- منصة Netflix للمشتركين وتشغيل الأفلام والمسلسلات
- باقة القنوات الإخبارية المباشرة (الجزيرة، العربية، الحدث، الإخبارية السعودية، بي بي سي)
- باقة الدين والقرآن (قناة القرآن الكريم، قناة مكة المكرمة مباشر الحرم)
- باقة الوثائقيات (ناشيونال جيوغرافيك، الجزيرة الوثائقية، ناسا الفضائية)
- باقة الرياضة (بي إن سبورتس، سباقات وسرعة)
- باقة المسلسلات العربية (شباب البومب المواسم 10، 11، 12، 13، 14)
- باقة الأفلام الأجنبية المتنوعة
- باقة أطفال وكرتون (مستر بين بث مباشر Mr Bean)
- تشغيل ملفات الفيديو المحلية (MP4, MKV, AVI, MOV)
- محرك VLC القوي لتشغيل البث المباشر بدقة فائقة وبدون تقطيع
- واجهة تلفزيون ذكية عصرية بلون الفحم الأسود (#0d0d0d) والأحمر السينمائي (#cc0000)
- التحكم الكامل بلوحة المفاتيح والماوس وشاشة كاملة (Full Screen)
=============================================================================
"""

import os
import sys
import json
import re
import glob
import webbrowser
import threading
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

try:
    import vlc
    VLC_AVAILABLE = True
except ImportError:
    VLC_AVAILABLE = False

APP_TITLE = "Awn Tv pro - رسيفر ذكي ومشغل وسائط"
CONFIG_FILE = "awn_tv_config.json"
DARK_BG = "#0d0d0d"
PANEL_BG = "#141414"
RED_PRIMARY = "#cc0000"
RED_HOVER = "#ff1a1a"
NETFLIX_RED = "#E50914"
TEXT_WHITE = "#ffffff"
TEXT_MUTED = "#999999"

# Verified channels, series, and movies requested by the user
DEFAULT_SAMPLE_CHANNELS = [
    # 1. الأخبار
    {
        "name": "الجزيرة الإخبارية مباشر HD",
        "url": "https://www.youtube.com/watch?v=bNyUyrR0PHo",
        "group": "قنوات إخبارية"
    },
    {
        "name": "قناة العربية مباشر (Al Arabiya)",
        "url": "https://www.youtube.com/watch?v=n7eQejkXbnM",
        "group": "قنوات إخبارية"
    },
    {
        "name": "قناة الحدث مباشر (Al Hadath)",
        "url": "https://www.youtube.com/watch?v=au8t81S0tag",
        "group": "قنوات إخبارية"
    },
    {
        "name": "الإخبارية السعودية مباشر HD",
        "url": "https://www.youtube.com/watch?v=-CzFOmQEamw",
        "group": "قنوات إخبارية"
    },
    {
        "name": "بي بي سي عربي مباشر (BBC Arabic)",
        "url": "https://www.youtube.com/watch?v=O1pGmVtj2Y8",
        "group": "قنوات إخبارية"
    },
    {
        "name": "بث إخباري مباشر وعاجل",
        "url": "https://www.youtube.com/watch?v=A1cZxijueg4",
        "group": "قنوات إخبارية"
    },
    {
        "name": "الجزيرة مباشر (Al Jazeera Mubasher)",
        "url": "https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
        "group": "قنوات إخبارية"
    },

    # 2. إسلاميات ودين
    {
        "name": "قناة القرآن الكريم مباشر HD",
        "url": "https://www.youtube.com/watch?v=7DHNbnPMNiM",
        "group": "إسلاميات ودين"
    },
    {
        "name": "قناة مكة المكرمة بث مباشر (الحرم المكي)",
        "url": "https://www.youtube.com/watch?v=h2rfbOSiDHs",
        "group": "إسلاميات ودين"
    },

    # 3. وثائقي وطبيعة
    {
        "name": "ناشيونال جيوغرافيك مباشر (National Geographic)",
        "url": "https://www.youtube.com/watch?v=MiQe9ob9aDc",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "الجزيرة الوثائقية مباشر HD",
        "url": "https://www.youtube.com/watch?v=TiPYdMXt_XI",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "ناسا الفضائية بث مباشر (Earth from Space)",
        "url": "https://www.youtube.com/watch?v=xRPjKOmTrRA",
        "group": "وثائقي وطبيعة"
    },

    # 4. رياضة وسرعة
    {
        "name": "بي إن سبورتس الإخبارية مباشر (beIN SPORTS)",
        "url": "https://www.youtube.com/watch?v=2lJZPT6OljI",
        "group": "رياضة وسرعة"
    },

    # 5. مسلسلات وقنوات عربية
    {
        "name": "قناة MBC 1 مباشر (MBC 1 Live HD)",
        "url": "https://mbc-1.catsbengal.com/",
        "group": "مسلسلات عربية"
    },
    {
        "name": "مسلسل شباب البومب - الموسم 14 (جديد)",
        "url": "https://www.youtube.com/watch?v=-g6vqGJwnvo",
        "group": "مسلسلات عربية"
    },
    {
        "name": "مسلسل شباب البومب - الموسم 13",
        "url": "https://www.youtube.com/watch?v=F00TxAxskik",
        "group": "مسلسلات عربية"
    },
    {
        "name": "مسلسل شباب البومب - الموسم 12",
        "url": "https://www.youtube.com/watch?v=hbadZXodW3g",
        "group": "مسلسلات عربية"
    },
    {
        "name": "مسلسل شباب البومب - الموسم 11",
        "url": "https://www.youtube.com/watch?v=8AYzIoO-gtU",
        "group": "مسلسلات عربية"
    },
    {
        "name": "مسلسل شباب البومب - الموسم 10",
        "url": "https://www.youtube.com/watch?v=9EMZrNRG4v8",
        "group": "مسلسلات عربية"
    },

    # 6. أفلام أجنبية
    {
        "name": "فيلم الأكشن والإثارة الأجنبي HD",
        "url": "https://www.youtube.com/watch?v=ozwywy1eeXs",
        "group": "أفلام أجنبية"
    },
    {
        "name": "فيلم المغامرة والتشويق الأجنبي 4K",
        "url": "https://www.youtube.com/watch?v=X0dnMxOViRE",
        "group": "أفلام أجنبية"
    },
    {
        "name": "الفيلم السينمائي الأجنبي المميز",
        "url": "https://www.youtube.com/watch?v=DlMaPNv6DfI",
        "group": "أفلام أجنبية"
    },
    {
        "name": "سينما الخيال العلمي: Tears of Steel 4K",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "group": "أفلام أجنبية"
    },

    # 7. أطفال وكرتون
    {
        "name": "كرتون نتورك بالعربية (CN-AR Starzplay)",
        "url": "https://starzplay.com/ar/watch/movies/cartoon-network-arabic/770559016375",
        "group": "أطفال وكرتون"
    },
    {
        "name": "وقت المغامرة بث مباشر (Adventure Time)",
        "url": "https://www.youtube.com/watch?v=DCOwDr3NaeA",
        "group": "أطفال وكرتون"
    },
    {
        "name": "كرتون سبونج بوب بالعربي (SpongeBob)",
        "url": "https://www.youtube.com/watch?v=0yo5wZB4MtQ",
        "group": "أطفال وكرتون"
    },
    {
        "name": "عالم غامبول المدهش بث مباشر (Gumball Live)",
        "url": "https://www.youtube.com/watch?v=yrmVhjGkfUc",
        "group": "أطفال وكرتون"
    },
    {
        "name": "عالم غامبول المدهش حلقات كاملة HD",
        "url": "https://www.youtube.com/watch?v=dosSZ6kkDmU",
        "group": "أطفال وكرتون"
    },
    {
        "name": "غريغ من الجدول بالعربي (Craig of the Creek)",
        "url": "https://www.youtube.com/watch?v=IEG4fRwREdw",
        "group": "أطفال وكرتون"
    },
    {
        "name": "كرتون كلارنس بالعربي (Clarence Live)",
        "url": "https://www.youtube.com/watch?v=-m_m-ToESIQ",
        "group": "أطفال وكرتون"
    },
    {
        "name": "كرتون بن تن بالعربي (Ben 10)",
        "url": "https://www.youtube.com/watch?v=NXnL8BNeO1o",
        "group": "أطفال وكرتون"
    },
    {
        "name": "مستر بين بث مباشر (Mr Bean Live)",
        "url": "https://www.youtube.com/watch?v=oPonPGALYaU",
        "group": "أطفال وكرتون"
    },
    {
        "name": "عالم الرسوم المتحركة: Big Buck Bunny 4K",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "group": "أطفال وكرتون"
    },

    # 8. وثائقيات واستكشاف عامة
    {
        "name": "وثائقي أسرار وعجائب الطبيعة والحياة البرية",
        "url": "https://www.youtube.com/watch?v=8iXxhJowLys",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "وثائقي الاستكشاف: عوالم خفية وأسرار الأرض",
        "url": "https://www.youtube.com/watch?v=M1dwBFISCzs",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "وثائقي التاريخ والغموض: أسرار لم تروَ من قبل",
        "url": "https://www.youtube.com/watch?v=DETWl3qO3jU",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "وثائقي كوكب الأرض: في أعماق المحيطات والبراري",
        "url": "https://www.youtube.com/watch?v=qDEgbKSlpBY",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "وثائقي الاكتشافات العلمية وتطور التكنولوجيا",
        "url": "https://www.youtube.com/watch?v=GCwTJ3E2VKc",
        "group": "وثائقي وطبيعة"
    },
    {
        "name": "وثائقي ملحمي: قصص وحضارات عبر الزمان",
        "url": "https://www.youtube.com/watch?v=vSqW8JVyHN0",
        "group": "وثائقي وطبيعة"
    },

    # 9. وثائقيات وتحقيقات أبو الصادق
    {
        "name": "وثائقي أبو الصادق: حقيقة اللغز والتحقيق الغامض",
        "url": "https://www.youtube.com/watch?v=WdYMvIgGimk",
        "group": "وثائقيات أبو الصادق"
    },
    {
        "name": "وثائقي أبو الصادق: كشف الأسرار والملف السري",
        "url": "https://www.youtube.com/watch?v=binhuv2N06I",
        "group": "وثائقيات أبو الصادق"
    },
    {
        "name": "وثائقي أبو الصادق: تفاصيل التحقيق والمغامرة",
        "url": "https://www.youtube.com/watch?v=ghjL9ayLXow",
        "group": "وثائقيات أبو الصادق"
    },
    {
        "name": "وثائقي أبو الصادق: رحلة البحث وراء الحقيقة",
        "url": "https://www.youtube.com/watch?v=ykdRzjHO7J4",
        "group": "وثائقيات أبو الصادق"
    },
    {
        "name": "وثائقي أبو الصادق: الوثائقي الشامل والأدلة",
        "url": "https://www.youtube.com/watch?v=tBKLuCr6qy4",
        "group": "وثائقيات أبو الصادق"
    },

    # 10. قصص وروايات مشوقة
    {
        "name": "قصص وروايات: القصة الواقعية المشوقة",
        "url": "https://www.youtube.com/watch?v=eFUnMBec_Po",
        "group": "قصص وروايات"
    },
    {
        "name": "قصص وروايات: لغز القضية الغامضة وأغرب الأحداث",
        "url": "https://www.youtube.com/watch?v=0PXjvwY0SHQ",
        "group": "قصص وروايات"
    },
    {
        "name": "قصص وروايات: القصة الحقيقية المؤثرة والمحيرة",
        "url": "https://www.youtube.com/watch?v=Vz_h2oAJ11A",
        "group": "قصص وروايات"
    },
    {
        "name": "قصص وروايات: ملحمة الأحداث وتفاصيل الرواية",
        "url": "https://www.youtube.com/watch?v=YVM3fnJix7M",
        "group": "قصص وروايات"
    },
    {
        "name": "قصص وروايات: أغرب القصص والاعترافات المثيرة",
        "url": "https://www.youtube.com/watch?v=hyGiFP3tSVk",
        "group": "قصص وروايات"
    },
    {
        "name": "قصص وروايات: التحقيق ولغز الجريمة الغامضة",
        "url": "https://www.youtube.com/watch?v=Cu1CJjF1S4c",
        "group": "قصص وروايات"
    },

    # 11. ملخصات أنمي
    {
        "name": "ملخص أنمي: الحلقة الملحمية والحكاية الكاملة 1",
        "url": "https://www.youtube.com/watch?v=O6X-9Y4sM9M",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: رحلة البطل والقوة الخارقة 2",
        "url": "https://www.youtube.com/watch?v=moLz9Jpr9MY",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: أسرار العالم الموازي والمواجهة 3",
        "url": "https://www.youtube.com/watch?v=NUVRV-O8l7k",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: السلسلة الأسطورية كاملة 4",
        "url": "https://www.youtube.com/watch?v=EjG1xORvJc4",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: مغامرة الغموض والانتقام 5",
        "url": "https://www.youtube.com/watch?v=tdn4MLyz3Zs",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: نهضة المحارب والأحداث النارية 6",
        "url": "https://www.youtube.com/watch?v=jbCHchQ7NeA",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: حكاية الإثارة والقتالات الحاسمة 7",
        "url": "https://www.youtube.com/watch?v=e3wyPPmiJFM",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: القصة الكاملة والتحولات الصادمة 8",
        "url": "https://www.youtube.com/watch?v=8piS8TSRoZw",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: أسطورة السيوف والمغامرة 9",
        "url": "https://www.youtube.com/watch?v=mjcLCdkm-jY",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: عالم السحر والتحديات الكبرى 10",
        "url": "https://www.youtube.com/watch?v=iQRhcjBqGxQ",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: القوة المطلقة وصراع الأبطال 11",
        "url": "https://www.youtube.com/watch?v=_I0f0FEUq5g",
        "group": "ملخصات انمي"
    },
    {
        "name": "ملخص أنمي: المواجهة الأخيرة والحكاية كاملة 12",
        "url": "https://www.youtube.com/watch?v=TTDRaMspm88",
        "group": "ملخصات انمي"
    },

    # 12. أغاني وموسيقى
    {"name": "قائمة الأغاني المختارة - تراك 1", "url": "https://www.youtube.com/watch?v=3NNDGW7PPcI", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 2", "url": "https://www.youtube.com/watch?v=gset79KMmt0", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 3", "url": "https://www.youtube.com/watch?v=dVPgBVr1QWY", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 4", "url": "https://www.youtube.com/watch?v=2I1NHvcaRcM", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 5", "url": "https://www.youtube.com/watch?v=LeehZ9Ki2pc", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 6", "url": "https://www.youtube.com/watch?v=Zkm2_E1mfZQ", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 7", "url": "https://www.youtube.com/watch?v=Rinpmwp5moc", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 8", "url": "https://www.youtube.com/watch?v=wh58wI-M_kQ", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 9", "url": "https://www.youtube.com/watch?v=_D2fK-HhTvo", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 10", "url": "https://www.youtube.com/watch?v=XXKXpf7xFC4", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 11", "url": "https://www.youtube.com/watch?v=QNrH83IM-0U", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 12", "url": "https://www.youtube.com/watch?v=5uh9imWsNNY", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 13", "url": "https://www.youtube.com/watch?v=UlIq7Rs3knU", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 14", "url": "https://www.youtube.com/watch?v=uKFQ2IDK300", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 15", "url": "https://www.youtube.com/watch?v=1lrFsXkT_rM", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 16", "url": "https://www.youtube.com/watch?v=Sru-0-EdbAc", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 17", "url": "https://www.youtube.com/watch?v=hnbALhWMLJI", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 18", "url": "https://www.youtube.com/watch?v=c5s4sfuEKxc", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 19", "url": "https://www.youtube.com/watch?v=l08Zw-RY__Q", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 20", "url": "https://www.youtube.com/watch?v=0iwTnRy9YsM", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 21", "url": "https://www.youtube.com/watch?v=kPa7bsKwL-c", "group": "أغاني وموسيقى"},
    {"name": "قائمة الأغاني المختارة - تراك 22", "url": "https://www.youtube.com/watch?v=NB7WuqWzDhw", "group": "أغاني وموسيقى"},

    # 11. منصات ذكية
    {
        "name": "🍿 منصة نتفلكس (Netflix Hub)",
        "url": "https://www.netflix.com/browse",
        "group": "منصات ذكية",
        "type": "netflix"
    }
]


def parse_m3u_file(filepath):
    channels = []
    if not os.path.exists(filepath):
        return channels

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        current_channel = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith("#EXTINF:"):
                group_match = re.search(r'group-title=["\'](.*?)["\']', line, re.IGNORECASE)
                group = group_match.group(1).strip() if group_match else "قنوات عامة"

                name_match = line.split(",")
                channel_name = name_match[-1].strip() if len(name_match) > 1 else "قناة بدون اسم"

                current_channel = {
                    "name": channel_name,
                    "group": group
                }
            elif not line.startswith("#") and current_channel:
                current_channel["url"] = line
                channels.append(current_channel)
                current_channel = {}

    except Exception as e:
        print(f"Error reading M3U: {e}")

    return channels


class AwnTvProApp:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("1280x760")
        self.root.minsize(960, 600)
        self.root.configure(bg=DARK_BG)

        self.channels = []
        self.filtered_channels = []
        self.current_channel_index = -1
        self.is_fullscreen = False
        self.is_playing = False
        self.volume = 80
        self.is_muted = False
        self.selected_group = "الكل"

        self.vlc_instance = None
        self.media_player = None
        self.init_vlc()

        self.setup_ui()
        self.bind_shortcuts()
        self.root.after(300, self.auto_load_playlist)

    def init_vlc(self):
        if not VLC_AVAILABLE:
            print("WARNING: python-vlc not installed.")
            return

        try:
            args = ["--no-xlib", "--quiet", "--network-caching=1500"]
            self.vlc_instance = vlc.Instance(" ".join(args))
            self.media_player = self.vlc_instance.media_player_new()
            self.media_player.audio_set_volume(self.volume)
        except Exception as e:
            print(f"Failed to initialize VLC: {e}")

    def setup_ui(self):
        # Header
        self.header_frame = tk.Frame(self.root, bg=PANEL_BG, height=60)
        self.header_frame.pack(side=tk.TOP, fill=tk.X, padx=0, pady=0)

        brand_box = tk.Frame(self.header_frame, bg=PANEL_BG)
        brand_box.pack(side=tk.LEFT, padx=16, pady=10)

        logo_lbl = tk.Label(brand_box, text="▶", font=("Arial", 16, "bold"), fg=RED_PRIMARY, bg=PANEL_BG)
        logo_lbl.pack(side=tk.LEFT, padx=(0, 6))

        title_lbl = tk.Label(brand_box, text="Awn Tv pro", font=("Cairo", 15, "bold"), fg=TEXT_WHITE, bg=PANEL_BG)
        title_lbl.pack(side=tk.LEFT)

        subtitle_lbl = tk.Label(brand_box, text=" | Smart IPTV Receiver", font=("Cairo", 10), fg=TEXT_MUTED, bg=PANEL_BG)
        subtitle_lbl.pack(side=tk.LEFT, padx=(4, 0))

        btn_box = tk.Frame(self.header_frame, bg=PANEL_BG)
        btn_box.pack(side=tk.RIGHT, padx=16, pady=10)

        self.is_kids_mode = False
        self.btn_kids_toggle = tk.Button(
            btn_box, text="🧸 وضع الأطفال", font=("Cairo", 10, "bold"),
            bg="#f59e0b", fg="#000000", activebackground="#d97706", activeforeground="#ffffff",
            bd=0, relief=tk.FLAT, padx=12, pady=6, cursor="hand2", command=self.toggle_kids_mode
        )
        self.btn_kids_toggle.pack(side=tk.RIGHT, padx=6)

        self.btn_netflix = tk.Button(
            btn_box, text="🍿 نتفلكس (Netflix)", font=("Cairo", 10, "bold"),
            bg=NETFLIX_RED, fg=TEXT_WHITE, activebackground="#b80710", activeforeground=TEXT_WHITE,
            bd=0, relief=tk.FLAT, padx=14, pady=6, cursor="hand2", command=self.open_netflix
        )
        self.btn_netflix.pack(side=tk.RIGHT, padx=6)

        self.btn_load_m3u = tk.Button(
            btn_box, text="📂 فتح قائمة M3U", font=("Cairo", 10, "bold"),
            bg=RED_PRIMARY, fg=TEXT_WHITE, activebackground=RED_HOVER, activeforeground=TEXT_WHITE,
            bd=0, relief=tk.FLAT, padx=12, pady=6, cursor="hand2", command=self.browse_m3u_file
        )
        self.btn_load_m3u.pack(side=tk.RIGHT, padx=6)

        self.btn_load_local = tk.Button(
            btn_box, text="🎬 فيلم محلي", font=("Cairo", 10),
            bg="#262626", fg=TEXT_WHITE, activebackground="#333333", activeforeground=TEXT_WHITE,
            bd=0, relief=tk.FLAT, padx=12, pady=6, cursor="hand2", command=self.browse_local_file
        )
        self.btn_load_local.pack(side=tk.RIGHT, padx=6)

        self.btn_downloads_scan = tk.Button(
            btn_box, text="🔄 فحص التنزيلات", font=("Cairo", 10),
            bg="#1f1f1f", fg="#cccccc", activebackground="#2a2a2a", activeforeground=TEXT_WHITE,
            bd=0, relief=tk.FLAT, padx=10, pady=6, cursor="hand2", command=self.scan_downloads_folder
        )
        self.btn_downloads_scan.pack(side=tk.RIGHT, padx=6)

        # Bottom Bar
        self.bottom_bar = tk.Frame(self.root, bg=PANEL_BG, height=65)
        self.bottom_bar.pack(side=tk.BOTTOM, fill=tk.X)
        self.setup_bottom_bar()

        # Workspace
        self.main_container = tk.Frame(self.root, bg=DARK_BG)
        self.main_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Right Sidebar
        self.sidebar_frame = tk.Frame(self.main_container, bg=PANEL_BG, width=340)
        self.sidebar_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(1, 0), pady=0)
        self.sidebar_frame.pack_propagate(False)
        self.setup_sidebar()

        # Video Area
        self.player_container = tk.Frame(self.main_container, bg="#000000")
        self.player_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.video_canvas = tk.Canvas(self.player_container, bg="#000000", highlightthickness=0)
        self.video_canvas.pack(fill=tk.BOTH, expand=True)
        self.video_canvas.bind("<Double-Button-1>", lambda e: self.toggle_fullscreen())
        self.video_canvas.bind("<Configure>", self.on_canvas_configure)

        self.placeholder_lbl = tk.Label(
            self.video_canvas,
            text="Awn Tv pro\nاختر قناة من القائمة الجانبية أو اضغط على Netflix للمشاهدة",
            font=("Cairo", 15, "bold"), fg="#555555", bg="#000000", justify=tk.CENTER
        )
        self.placeholder_lbl.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

    def setup_sidebar(self):
        sidebar_top = tk.Frame(self.sidebar_frame, bg=PANEL_BG)
        sidebar_top.pack(fill=tk.X, padx=12, pady=10)

        sb_title = tk.Label(sidebar_top, text="دليل القنوات والباقات", font=("Cairo", 12, "bold"), fg=TEXT_WHITE, bg=PANEL_BG)
        sb_title.pack(side=tk.RIGHT)

        self.channel_count_lbl = tk.Label(sidebar_top, text="0 قناة", font=("Cairo", 9), fg=RED_HOVER, bg=PANEL_BG)
        self.channel_count_lbl.pack(side=tk.LEFT)

        search_box = tk.Frame(self.sidebar_frame, bg="#1e1e1e", bd=1, relief=tk.SOLID)
        search_box.pack(fill=tk.X, padx=12, pady=(0, 8))

        search_icon = tk.Label(search_box, text="🔍", font=("Arial", 10), bg="#1e1e1e", fg=TEXT_MUTED)
        search_icon.pack(side=tk.RIGHT, padx=6)

        self.search_var = tk.StringVar()
        self.search_var.trace("w", self.on_search_changed)
        self.search_entry = tk.Entry(
            search_box, textvariable=self.search_var, font=("Cairo", 10),
            bg="#1e1e1e", fg=TEXT_WHITE, bd=0, insertbackground=RED_PRIMARY, justify=tk.RIGHT
        )
        self.search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=6, pady=6)

        filter_box = tk.Frame(self.sidebar_frame, bg=PANEL_BG)
        filter_box.pack(fill=tk.X, padx=12, pady=(0, 8))

        lbl_filter = tk.Label(filter_box, text="الباقة:", font=("Cairo", 9), fg=TEXT_MUTED, bg=PANEL_BG)
        lbl_filter.pack(side=tk.RIGHT, padx=(4, 0))

        self.group_var = tk.StringVar(value="الكل")
        self.group_menu = tk.OptionMenu(filter_box, self.group_var, "الكل", command=self.on_group_selected)
        self.group_menu.configure(bg="#222222", fg=TEXT_WHITE, activebackground=RED_PRIMARY, bd=0, highlightthickness=0, font=("Cairo", 9))
        self.group_menu["menu"].configure(bg="#1a1a1a", fg=TEXT_WHITE, activebackground=RED_PRIMARY, font=("Cairo", 9))
        self.group_menu.pack(side=tk.RIGHT, fill=tk.X, expand=True)

        list_frame = tk.Frame(self.sidebar_frame, bg=PANEL_BG)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))

        scrollbar = tk.Scrollbar(list_frame, bg="#1e1e1e", troughcolor=PANEL_BG, bd=0)
        scrollbar.pack(side=tk.LEFT, fill=tk.Y)

        self.channel_listbox = tk.Listbox(
            list_frame,
            bg="#121212",
            fg="#dddddd",
            selectbackground=RED_PRIMARY,
            selectforeground=TEXT_WHITE,
            activestyle="none",
            bd=0,
            font=("Cairo", 10),
            highlightthickness=1,
            highlightcolor=RED_PRIMARY,
            highlightbackground="#222222",
            yscrollcommand=scrollbar.set,
            justify=tk.RIGHT
        )
        self.channel_listbox.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.channel_listbox.yview)

        self.channel_listbox.bind("<Double-Button-1>", self.on_channel_double_click)
        self.channel_listbox.bind("<Return>", self.on_channel_double_click)

    def setup_bottom_bar(self):
        info_frame = tk.Frame(self.bottom_bar, bg=PANEL_BG)
        info_frame.pack(side=tk.RIGHT, padx=16, pady=10)

        self.now_playing_title = tk.Label(
            info_frame, text="جاهز للتشغيل", font=("Cairo", 11, "bold"), fg=TEXT_WHITE, bg=PANEL_BG
        )
        self.now_playing_title.pack(anchor="e")

        self.now_playing_group = tk.Label(
            info_frame, text="Awn Tv pro Receiver", font=("Cairo", 9), fg=TEXT_MUTED, bg=PANEL_BG
        )
        self.now_playing_group.pack(anchor="e")

        ctrl_frame = tk.Frame(self.bottom_bar, bg=PANEL_BG)
        ctrl_frame.pack(side=tk.LEFT, padx=16, pady=10)

        btn_prev = tk.Button(
            ctrl_frame, text="⏮ السابق", font=("Cairo", 9), bg="#222222", fg=TEXT_WHITE,
            bd=0, padx=8, pady=4, cursor="hand2", command=self.play_previous_channel
        )
        btn_prev.pack(side=tk.LEFT, padx=3)

        self.btn_play_pause = tk.Button(
            ctrl_frame, text="▶ تشغيل", font=("Cairo", 10, "bold"), bg=RED_PRIMARY, fg=TEXT_WHITE,
            activebackground=RED_HOVER, bd=0, padx=14, pady=5, cursor="hand2", command=self.toggle_play_pause
        )
        self.btn_play_pause.pack(side=tk.LEFT, padx=4)

        btn_stop = tk.Button(
            ctrl_frame, text="⏹ إيقاف", font=("Cairo", 9), bg="#222222", fg=TEXT_WHITE,
            bd=0, padx=8, pady=4, cursor="hand2", command=self.stop_playback
        )
        btn_stop.pack(side=tk.LEFT, padx=3)

        btn_next = tk.Button(
            ctrl_frame, text="التالي ⏭", font=("Cairo", 9), bg="#222222", fg=TEXT_WHITE,
            bd=0, padx=8, pady=4, cursor="hand2", command=self.play_next_channel
        )
        btn_next.pack(side=tk.LEFT, padx=3)

        # Volume
        vol_frame = tk.Frame(self.bottom_bar, bg=PANEL_BG)
        vol_frame.pack(side=tk.LEFT, padx=20, pady=10)

        self.btn_mute = tk.Button(
            vol_frame, text="🔊", font=("Arial", 11), bg=PANEL_BG, fg=TEXT_WHITE,
            bd=0, cursor="hand2", command=self.toggle_mute
        )
        self.btn_mute.pack(side=tk.LEFT, padx=(0, 4))

        self.vol_scale = tk.Scale(
            vol_frame, from_=0, to=100, orient=tk.HORIZONTAL, bg=PANEL_BG, fg=TEXT_WHITE,
            troughcolor="#333333", activebackground=RED_PRIMARY, highlightthickness=0,
            bd=0, length=90, showvalue=0, command=self.on_volume_changed
        )
        self.vol_scale.set(self.volume)
        self.vol_scale.pack(side=tk.LEFT)

        self.vol_label = tk.Label(vol_frame, text="80%", font=("Cairo", 9), fg=TEXT_MUTED, bg=PANEL_BG, width=4)
        self.vol_label.pack(side=tk.LEFT, padx=4)

        # Fullscreen
        btn_fs = tk.Button(
            self.bottom_bar, text="⛶ شاشة كاملة (F11)", font=("Cairo", 9), bg="#222222", fg=TEXT_WHITE,
            activebackground=RED_PRIMARY, bd=0, padx=10, pady=4, cursor="hand2", command=self.toggle_fullscreen
        )
        btn_fs.pack(side=tk.RIGHT, padx=16, pady=10)

    def toggle_kids_mode(self):
        self.is_kids_mode = not self.is_kids_mode
        if self.is_kids_mode:
            self.btn_kids_toggle.config(text="✓ وضع الأطفال نشط", bg="#10b981", fg="#ffffff")
            self.selected_group = "أطفال وكرتون"
            self.group_var.set("أطفال وكرتون")
            self.now_playing_title.config(text="🧸 وضع الأطفال الآمن مفعّل")
            self.now_playing_group.config(text="تم تصفية القنوات إلى كرتون الأطفال فقط")
        else:
            self.btn_kids_toggle.config(text="🧸 وضع الأطفال", bg="#f59e0b", fg="#000000")
            self.selected_group = "الكل"
            self.group_var.set("الكل")
            self.now_playing_title.config(text="جاهز للتشغيل")
            self.now_playing_group.config(text="Awn Tv pro Receiver")
        self.apply_filter()

    def open_netflix(self):
        webbrowser.open("https://www.netflix.com/browse")
        self.now_playing_title.config(text="🍿 تم فتح منصة Netflix")
        self.now_playing_group.config(text="سجل الدخول بحسابك لمشاهدة الأفلام والمسلسلات")

    def on_canvas_configure(self, event=None):
        if self.media_player:
            try:
                if sys.platform.startswith("win"):
                    self.media_player.set_hwnd(self.video_canvas.winfo_id())
                elif sys.platform.startswith("linux"):
                    self.media_player.set_xwindow(self.video_canvas.winfo_id())
                elif sys.platform == "darwin":
                    self.media_player.set_nsobject(self.video_canvas.winfo_id())
            except Exception as e:
                print(f"Canvas binding error: {e}")

    def bind_shortcuts(self):
        self.root.bind("<F11>", lambda e: self.toggle_fullscreen())
        self.root.bind("<Escape>", self.exit_fullscreen)
        self.root.bind("<space>", lambda e: self.toggle_play_pause())
        self.root.bind("<Up>", lambda e: self.navigate_channel(-1))
        self.root.bind("<Down>", lambda e: self.navigate_channel(1))
        self.root.bind("<m>", lambda e: self.toggle_mute())
        self.root.bind("<M>", lambda e: self.toggle_mute())

    def auto_load_playlist(self):
        downloads_dir = str(Path.home() / "Downloads")
        target_files = [
            os.path.join(downloads_dir, "popular-movies-iptv.m3u"),
            os.path.join(downloads_dir, "popular-movies-iptv.m3u8"),
        ]

        found_m3u = None
        for tf in target_files:
            if os.path.exists(tf):
                found_m3u = tf
                break

        if not found_m3u:
            general_m3us = glob.glob(os.path.join(downloads_dir, "*.m3u*"))
            if general_m3us:
                found_m3u = general_m3us[0]

        if not found_m3u and os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    last_file = data.get("last_m3u_file")
                    if last_file and os.path.exists(last_file):
                        found_m3u = last_file
            except Exception:
                pass

        if found_m3u:
            self.load_playlist_from_path(found_m3u)
        else:
            self.set_channels(DEFAULT_SAMPLE_CHANNELS)
            self.now_playing_group.config(text="تم تحميل القنوات الافتراضية")

    def scan_downloads_folder(self):
        downloads_dir = str(Path.home() / "Downloads")
        m3u_files = glob.glob(os.path.join(downloads_dir, "*.m3u*"))
        if m3u_files:
            self.load_playlist_from_path(m3u_files[0])
            messagebox.showinfo("تم العثور على قائمة", f"تم العثور على ملف القنوات:\n{os.path.basename(m3u_files[0])}\nوتحميله بنجاح!")
        else:
            messagebox.showinfo("مجلد التنزيلات", "لم يتم العثور على ملفات بصيغة .m3u في مجلد التنزيلات.")

    def browse_m3u_file(self):
        filepath = filedialog.askopenfilename(
            title="اختر ملف قنوات IPTV",
            filetypes=[("قوائم M3U", "*.m3u *.m3u8"), ("جميع الملفات", "*.*")]
        )
        if filepath:
            self.load_playlist_from_path(filepath)
            try:
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump({"last_m3u_file": filepath}, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

    def browse_local_file(self):
        filepath = filedialog.askopenfilename(
            title="اختر ملف فيديو للعرض",
            filetypes=[
                ("ملفات الفيديو", "*.mp4 *.mkv *.avi *.mov *.wmv *.flv *.ts *.webm"),
                ("جميع الملفات", "*.*")
            ]
        )
        if filepath:
            filename = os.path.basename(filepath)
            local_ch = {
                "name": f"🎬 {filename}",
                "url": filepath,
                "group": "وسائط محلية"
            }
            self.channels.insert(0, local_ch)
            self.update_group_filter_menu()
            self.apply_filter()
            self.play_channel_at_index(0)

    def load_playlist_from_path(self, filepath):
        channels = parse_m3u_file(filepath)
        if channels:
            netflix_entry = {
                "name": "🍿 منصة نتفلكس (Netflix Hub)",
                "url": "https://www.netflix.com/browse",
                "group": "منصات ذكية",
                "type": "netflix"
            }
            channels.insert(0, netflix_entry)
            self.set_channels(channels)
            self.now_playing_group.config(text=f"القائمة: {os.path.basename(filepath)}")
        else:
            messagebox.showwarning("تنبيه", "الملف المختار فارغ أو لا يحتوي على روابط قنوات صحيحة.")

    def set_channels(self, channels):
        self.channels = channels
        self.update_group_filter_menu()
        self.apply_filter()

    def update_group_filter_menu(self):
        groups = sorted(list(set(ch.get("group", "عام") for ch in self.channels)))
        menu = self.group_menu["menu"]
        menu.delete(0, "end")

        menu.add_command(label="الكل", command=lambda: self.on_group_selected("الكل"))
        for grp in groups:
            menu.add_command(label=grp, command=lambda g=grp: self.on_group_selected(g))

        self.group_var.set("الكل")
        self.selected_group = "الكل"

    def on_group_selected(self, group_name):
        self.selected_group = group_name
        self.group_var.set(group_name)
        self.apply_filter()

    def on_search_changed(self, *args):
        self.apply_filter()

    def apply_filter(self):
        query = self.search_var.get().strip().lower()
        self.filtered_channels = []

        for ch in self.channels:
            name = ch.get("name", "").lower()
            group = ch.get("group", "")

            if self.selected_group != "الكل" and group != self.selected_group:
                continue

            if query and query not in name:
                continue

            self.filtered_channels.append(ch)

        self.channel_listbox.delete(0, tk.END)
        for i, ch in enumerate(self.filtered_channels, 1):
            disp = f"{i:02d}. {ch.get('name', 'بدون اسم')}  [{ch.get('group', 'عام')}]"
            self.channel_listbox.insert(tk.END, disp)

        self.channel_count_lbl.config(text=f"{len(self.filtered_channels)} قناة ومسلسل")

    def on_channel_double_click(self, event=None):
        selection = self.channel_listbox.curselection()
        if selection:
            index = selection[0]
            self.play_channel_at_index(index)

    def play_channel_at_index(self, index):
        if index < 0 or index >= len(self.filtered_channels):
            return

        self.current_channel_index = index
        channel = self.filtered_channels[index]
        url = channel.get("url")

        if channel.get("type") == "netflix" or "netflix.com" in url:
            self.open_netflix()
            return

        self.now_playing_title.config(text=f"▶ {channel.get('name', '')}")
        self.now_playing_group.config(text=f"الباقة: {channel.get('group', 'عام')}")
        self.placeholder_lbl.place_forget()

        self.channel_listbox.selection_clear(0, tk.END)
        self.channel_listbox.selection_set(index)
        self.channel_listbox.see(index)

        # In VLC, YouTube URLs can be played directly or opened in browser
        if "youtube.com" in url or "youtu.be" in url:
            try:
                self.on_canvas_configure()
                media = self.vlc_instance.media_new(url)
                self.media_player.set_media(media)
                self.media_player.play()
                self.is_playing = True
                self.btn_play_pause.config(text="⏸ إيقاف مؤقت", bg=RED_HOVER)
                return
            except Exception:
                webbrowser.open(url)
                return

        if not self.media_player:
            messagebox.showwarning(
                "مشغل VLC غير مثبت",
                "يرجى تثبيت مشغل VLC 64-bit على ويندوز لتشغيل قنوات البث المباشر."
            )
            return

        try:
            self.on_canvas_configure()
            media = self.vlc_instance.media_new(url)
            self.media_player.set_media(media)
            self.media_player.play()
            self.is_playing = True
            self.btn_play_pause.config(text="⏸ إيقاف مؤقت", bg=RED_HOVER)
        except Exception as e:
            messagebox.showerror("خطأ في التشغيل", f"تعذر تشغيل هذا الرابط:\n{e}")

    def toggle_play_pause(self):
        if not self.media_player:
            return

        if self.is_playing:
            self.media_player.pause()
            self.is_playing = False
            self.btn_play_pause.config(text="▶ استئناف", bg=RED_PRIMARY)
        else:
            if self.current_channel_index == -1 and self.filtered_channels:
                self.play_channel_at_index(0)
            else:
                self.media_player.play()
                self.is_playing = True
                self.btn_play_pause.config(text="⏸ إيقاف مؤقت", bg=RED_HOVER)

    def stop_playback(self):
        if self.media_player:
            self.media_player.stop()
            self.is_playing = False
            self.btn_play_pause.config(text="▶ تشغيل", bg=RED_PRIMARY)
            self.placeholder_lbl.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
            self.now_playing_title.config(text="متوقف")

    def play_next_channel(self):
        if not self.filtered_channels:
            return
        next_idx = (self.current_channel_index + 1) % len(self.filtered_channels)
        self.play_channel_at_index(next_idx)

    def play_previous_channel(self):
        if not self.filtered_channels:
            return
        prev_idx = (self.current_channel_index - 1) % len(self.filtered_channels)
        self.play_channel_at_index(prev_idx)

    def navigate_channel(self, step):
        if not self.filtered_channels:
            return
        new_idx = self.current_channel_index + step
        if 0 <= new_idx < len(self.filtered_channels):
            self.play_channel_at_index(new_idx)

    def on_volume_changed(self, val):
        vol = int(val)
        self.volume = vol
        self.vol_label.config(text=f"{vol}%")
        if self.media_player:
            self.media_player.audio_set_volume(vol)
        if vol > 0:
            self.is_muted = False
            self.btn_mute.config(text="🔊")

    def toggle_mute(self):
        if not self.media_player:
            return
        if self.is_muted:
            self.media_player.audio_set_mute(False)
            self.is_muted = False
            self.btn_mute.config(text="🔊")
            self.vol_scale.set(self.volume)
        else:
            self.media_player.audio_set_mute(True)
            self.is_muted = True
            self.btn_mute.config(text="🔇")

    def toggle_fullscreen(self):
        self.is_fullscreen = not self.is_fullscreen
        self.root.attributes("-fullscreen", self.is_fullscreen)
        if self.is_fullscreen:
            self.header_frame.pack_forget()
            self.sidebar_frame.pack_forget()
            self.bottom_bar.pack_forget()
        else:
            self.header_frame.pack(side=tk.TOP, fill=tk.X)
            self.bottom_bar.pack(side=tk.BOTTOM, fill=tk.X)
            self.sidebar_frame.pack(side=tk.RIGHT, fill=tk.Y)

    def exit_fullscreen(self, event=None):
        if self.is_fullscreen:
            self.toggle_fullscreen()


def main():
    root = tk.Tk()
    app = AwnTvProApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
