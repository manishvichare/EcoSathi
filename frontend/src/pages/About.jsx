import Card from '../components/common/Card';

/**
 * About Page
 * 
 * Information about EcoSathi, its mission, and team.
 * 
 * Route: /about
 */
export default function About() {
  const team = [
    { role: 'Frontend Developer', emoji: '💻' },
    { role: 'Backend Developer', emoji: '⚙️' },
    { role: 'AI/ML Developer', emoji: '🤖' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          About EcoSathi
        </h1>
        <p className="text-lg text-gray-600">
          Learn about our mission to create greener, healthier cities
        </p>
      </div>

      {/* Mission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card title="Our Mission">
          <div className="space-y-4">
            <p className="text-gray-600">
              EcoSathi is on a mission to empower citizens and civic authorities
              to monitor and improve environmental health in urban areas.
            </p>
            <p className="text-gray-600">
              We believe that environmental data means little unless it's
              translated into clear actions and visible impact. Our platform
              bridges that gap by pairing real-time environmental monitoring
              with AI-powered insights and community participation.
            </p>
            <p className="text-gray-600">
              By making environmental monitoring accessible, understandable,
              and actionable, we're enabling cities to become greener, healthier
              places to live.
            </p>
          </div>
        </Card>

        <Card title="Why EcoSathi?">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-3xl">🌱</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Real-time Data</h3>
                <p className="text-sm text-gray-600">
                  Live air quality, temperature, and green cover metrics
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Clear Insights</h3>
                <p className="text-sm text-gray-600">
                  Environmental Health Score translates complexity into action
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🤝</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Community Action</h3>
                <p className="text-sm text-gray-600">
                  Report issues, earn points, and compete to make change
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">AI Assistance</h3>
                <p className="text-sm text-gray-600">
                  Smart analysis and personalized recommendations
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="mb-12" title="How It Works">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-4">1</div>
            <h3 className="font-bold text-gray-800 mb-2">Monitor</h3>
            <p className="text-gray-600 text-sm">
              We pull live environmental data from multiple sources - AQI APIs,
              satellite imagery, and citizen reports.
            </p>
          </div>

          <div>
            <div className="text-4xl font-bold text-primary-600 mb-4">2</div>
            <h3 className="font-bold text-gray-800 mb-2">Analyze</h3>
            <p className="text-gray-600 text-sm">
              AI models interpret the data and generate a Health Score,
              predictions, and actionable insights.
            </p>
          </div>

          <div>
            <div className="text-4xl font-bold text-primary-600 mb-4">3</div>
            <h3 className="font-bold text-gray-800 mb-2">Act</h3>
            <p className="text-gray-600 text-sm">
              Citizens report issues, civic authorities respond, and the
              community competes to improve environmental health.
            </p>
          </div>
        </div>
      </Card>

      {/* Team Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Our Team</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index}>
              <div className="text-center">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800">
                  {member.role}
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  Building EcoSathi with passion for the environment
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Technologies */}
      <Card title="Technology Stack">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Frontend</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>✓ React + Vite</li>
              <li>✓ Tailwind CSS</li>
              <li>✓ Recharts for data visualization</li>
              <li>✓ React Leaflet for interactive maps</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-4">Backend & AI</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>✓ Node.js / Express</li>
              <li>✓ Python / FastAPI</li>
              <li>✓ MongoDB for data storage</li>
              <li>✓ Claude/OpenAI for AI insights</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}