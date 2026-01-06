import { Skeleton } from '@/components/ui/skeleton';
import { LocaleLink } from '@/i18n/navigation';
import { formatDate } from '@/lib/formatter';
import { type BlogType, authorSource, categorySource } from '@/lib/source';
import Image from 'next/image';
import { PremiumBadge } from '../premium/premium-badge';
// import BlogImage from './blog-image';

interface BlogCardProps {
  locale: string;
  post: BlogType;
}

export default function BlogCard({ locale, post }: BlogCardProps) {
  const { date, title, description, image, author, categories } = post.data;
  const publishDate = formatDate(new Date(date));
  const blogAuthor = authorSource.getPage([author], locale);
  const blogCategories = categorySource
    .getPages(locale)
    .filter((category) => categories.includes(category.slugs[0] ?? ''));

  return (
    <LocaleLink href={`/blog/${post.slugs}`} className="block h-full">
      <div className="group flex flex-col border border-border rounded-lg overflow-hidden h-full transition-all duration-300 ease-in-out hover:border-primary hover:shadow-lg hover:shadow-primary/20">
        {/* Post info container */}
        <div className="flex flex-col justify-between p-4 flex-1">
          {/* Premium badge and categories at the top */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* categories */}
            <div className="flex flex-wrap gap-1">
              {blogCategories &&
                blogCategories.length > 0 &&
                blogCategories.map((category, index) => (
                  <span
                    key={`${category?.slugs[0]}-${index}`}
                    className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md"
                  >
                    {category?.data.name}
                  </span>
                ))}
            </div>

            {/* Premium badge - right side */}
            {post.data.premium && (
              <div className="flex-shrink-0">
                <PremiumBadge size="sm" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {/* Post title */}
            <h3 className="text-lg line-clamp-2 font-medium">{title}</h3>

            {/* Post excerpt */}
            <div className="mt-2">
              {description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Author and date */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between space-x-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 shrink-0">
                {blogAuthor?.data.avatar && (
                  <Image
                    src={blogAuthor?.data.avatar}
                    alt={`avatar for ${blogAuthor?.data.name}`}
                    className="rounded-full object-cover border"
                    fill
                  />
                )}
              </div>
              <span className="truncate text-sm">{blogAuthor?.data.name}</span>
            </div>

            <time className="truncate text-sm" dateTime={date}>
              {publishDate}
            </time>
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-full">
      <div className="p-4 flex flex-col justify-between flex-1 h-full">
        {/* Top section for categories and premium badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex gap-1">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>

        <div className="flex-1">
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
