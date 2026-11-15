import { Channel } from '../types/iptv';

export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];

  let currentChannel: Partial<Channel> | null = null;
  let channelIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Example line:
      // #EXTINF:-1 tvg-id="CNN.us" tvg-name="CNN HD" tvg-logo="https://example.com/logo.png" group-title="News", CNN HD
      const infoPart = line.substring(8);

      // Extract attributes
      const tvgIdMatch = infoPart.match(/tvg-id=["'](.*?)["']/i);
      const tvgNameMatch = infoPart.match(/tvg-name=["'](.*?)["']/i);
      const tvgLogoMatch = infoPart.match(/tvg-logo=["'](.*?)["']/i);
      const groupMatch = infoPart.match(/group-title=["'](.*?)["']/i);

      // The channel title is after the last comma
      const commaIndex = infoPart.lastIndexOf(',');
      let rawTitle = '';
      if (commaIndex !== -1) {
        rawTitle = infoPart.substring(commaIndex + 1).trim();
      } else if (tvgNameMatch && tvgNameMatch[1]) {
        rawTitle = tvgNameMatch[1].trim();
      } else {
        rawTitle = `قناة ${channelIndex}`;
      }

      // Detect resolution from title
      let resolution: Channel['resolution'] = 'HD';
      const upperTitle = rawTitle.toUpperCase();
      if (upperTitle.includes('4K') || upperTitle.includes('UHD')) {
        resolution = '4K';
      } else if (upperTitle.includes('1080') || upperTitle.includes('FHD') || upperTitle.includes('FULL HD')) {
        resolution = 'FHD';
      } else if (upperTitle.includes('720') || upperTitle.includes('HD')) {
        resolution = 'HD';
      } else if (upperTitle.includes('SD') || upperTitle.includes('480')) {
        resolution = 'SD';
      }

      const group = (groupMatch && groupMatch[1]?.trim()) || 'قنوات عامة';

      currentChannel = {
        id: `ch-m3u-${Date.now()}-${channelIndex}`,
        name: rawTitle,
        tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        group: group,
        resolution: resolution,
        type: line.toLowerCase().includes('.mp4') || line.toLowerCase().includes('.mkv') ? 'vod' : 'live'
      };
      channelIndex++;
    } else if (!line.startsWith('#') && currentChannel) {
      // This line is the stream URL
      currentChannel.url = line;
      if (line.includes('.mp4') || line.includes('.mkv') || line.includes('.webm')) {
        currentChannel.type = 'vod';
      } else {
        currentChannel.type = 'live';
      }
      channels.push(currentChannel as Channel);
      currentChannel = null;
    }
  }

  return channels;
}

export function exportPlaylistToM3U(channels: Channel[], playlistName = 'Awn_Tv_pro_Playlist'): string {
  let m3u = `#EXTM3U name="${playlistName}"\n\n`;

  channels.forEach((ch, idx) => {
    const tvgId = ch.tvgId ? ` tvg-id="${ch.tvgId}"` : '';
    const logo = ch.logo ? ` tvg-logo="${ch.logo}"` : '';
    const group = ` group-title="${ch.group || 'عام'}"`;

    m3u += `#EXTINF:-1${tvgId}${logo}${group}, ${ch.name}\n`;
    m3u += `${ch.url}\n\n`;
  });

  return m3u;
}
