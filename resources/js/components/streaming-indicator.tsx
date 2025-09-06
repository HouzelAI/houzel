import { cn } from '@/lib/utils';
import { useStream } from '@laravel/stream-react';
import { TextShimmer } from './motion-primitives/text-shimmer';

interface StreamingIndicatorProps {
    id: string;
    className?: string;
}

export default function StreamingIndicator({ id, className }: StreamingIndicatorProps) {
    const { isFetching, isStreaming } = useStream('chat', { id });

    // if (isStreaming) {
    //     return <div className={cn('size-2 animate-pulse rounded-full bg-green-500', className)} />;
    // }

    if (isFetching) {
        return <>
            <TextShimmer className={cn('text-sm', className)} duration={1}>Pensando...</TextShimmer>
        </>
        // return <div className={cn('size-2 animate-pulse rounded-full bg-yellow-500', className)} />;
    }

    return null;
}
