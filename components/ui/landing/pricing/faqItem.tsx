
interface FAQItemProps {
  question: string;
  answer: string;

}

export function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className='border-b border-white/5 pb-4'>
      <h5 className='font-medium text-white mb-2'>{question}</h5>
      <p className='text-zinc-500 text-sm'>{answer}</p>
    </div>
  );
}