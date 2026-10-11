import Image from 'next/image';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { getUserDisplayName } from '@/lib/user-helpers';

export function ReelIdentity({ reel }: { reel: Post }) {
  return <>
                    {/* User Info Overlay */}
                    <div className="absolute bottom-20 left-4 right-20 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        {reel.author?.avatar ? (
                          <Image
                            src={reel.author.avatar}
                            alt={reel.author.username}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {reel.author?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{getUserDisplayName(reel.author)}</p>
                        </div>
                      </div>

                      {/* Caption */}
                      {reel.content && (
                        <p className="text-sm line-clamp-2 mb-2">{reel.content}</p>
                      )}
                    </div>

  </>;
}
