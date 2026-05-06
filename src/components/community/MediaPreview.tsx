import type { CommunityMediaType } from '@/types/community';

interface MediaPreviewProps {
  mediaUrl: string | null;
  mediaType: CommunityMediaType | null;
  mediaName?: string | null;
}

function getEmbedUrl(mediaUrl: string) {
  try {
    const url = new URL(mediaUrl);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/').filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export default function MediaPreview({ mediaUrl, mediaType, mediaName }: MediaPreviewProps) {
  if (!mediaUrl || !mediaType) return null;

  if (mediaType === 'image') {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img
          src={mediaUrl}
          alt={mediaName || 'DataTalk post media'}
          loading="lazy"
          className="max-h-[520px] w-full object-contain"
        />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-black">
        <video controls preload="metadata" className="max-h-[520px] w-full">
          <source src={mediaUrl} type="video/mp4" />
        </video>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(mediaUrl);

  if (embedUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-950">
        <iframe
          src={embedUrl}
          title={mediaName || 'Embedded video'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-primary hover:text-blue-primary"
    >
      <span className="truncate">{mediaName || mediaUrl}</span>
      <span aria-hidden="true">Open</span>
    </a>
  );
}
