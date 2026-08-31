import { ScreenHeader } from "@/components/ScreenHeader";

type Props = {
  title: string;
  message: string;
};

export function ComingSoonScreen({ title, message }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title={title} />
      <div className="flex flex-1 items-center justify-center px-8 pb-24">
        <div className="card max-w-sm rounded-[28px] px-8 py-10 text-center">
          <span className="mx-auto mb-5 block size-14 rounded-full bg-accent/12 ring-8 ring-accent/6" />
          <p className="text-[16px] leading-6 text-ink-secondary">{message}</p>
        </div>
      </div>
    </div>
  );
}
