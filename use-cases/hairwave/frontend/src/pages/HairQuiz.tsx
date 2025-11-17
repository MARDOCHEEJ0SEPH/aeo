import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HairQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    hairType: '',
    concern: '',
    goal: '',
  });

  const handleSubmit = () => {
    // In a real app, this would recommend products based on answers
    navigate('/products');
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="font-serif text-4xl font-bold text-center mb-4">Find Your Perfect Match</h1>
      <p className="text-center text-gray-600 mb-12">
        Answer a few questions to get personalized product recommendations
      </p>

      <div className="card p-8">
        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl font-bold mb-6">What's your hair type?</h2>
            <div className="space-y-3">
              {['Straight', 'Wavy', 'Curly', 'Coily'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setAnswers({ ...answers, hairType: type });
                    setStep(2);
                  }}
                  className="w-full p-4 text-left border-2 rounded-lg hover:border-primary transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-2xl font-bold mb-6">What's your main hair concern?</h2>
            <div className="space-y-3">
              {['Dryness', 'Damage', 'Hair Loss', 'Frizz', 'Lack of Volume'].map((concern) => (
                <button
                  key={concern}
                  onClick={() => {
                    setAnswers({ ...answers, concern });
                    setStep(3);
                  }}
                  className="w-full p-4 text-left border-2 rounded-lg hover:border-primary transition-colors"
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-serif text-2xl font-bold mb-6">What's your hair goal?</h2>
            <div className="space-y-3">
              {['Stronger Hair', 'More Shine', 'Faster Growth', 'Better Texture'].map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    setAnswers({ ...answers, goal });
                    handleSubmit();
                  }}
                  className="w-full p-4 text-left border-2 rounded-lg hover:border-primary transition-colors flex items-center justify-between"
                >
                  {goal}
                  <ArrowRight size={20} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${s === step ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
