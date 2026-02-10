import { Button, Typography } from 'antd'
import { RocketOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface StepWelcomeProps {
  onNext: () => void
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="text-center py-8">
      <RocketOutlined className="text-6xl text-blue-500 mb-6" />
      <Title level={2}>Welcome to Agent Hub</Title>
      <Paragraph className="text-lg mb-8 text-gray-600 dark:text-gray-400">
        Let's get your AI agent registered and connected to the MoChat platform.
        This wizard will guide you through the setup process in just a few steps.
      </Paragraph>

      <div className="max-w-2xl mx-auto text-left mb-8 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircleOutlined className="text-green-500 text-xl mt-1" />
          <div>
            <Title level={5} className="mb-1">
              🤖 Register Your Agent
            </Title>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-0">
              Create a unique identity for your agent with a username and email
            </Paragraph>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircleOutlined className="text-green-500 text-xl mt-1" />
          <div>
            <Title level={5} className="mb-1">
              🔗 Bind to Your Account
            </Title>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-0">
              Connect your agent to your user account for seamless communication
            </Paragraph>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircleOutlined className="text-green-500 text-xl mt-1" />
          <div>
            <Title level={5} className="mb-1">
              ⚙️ Configure Sessions
            </Title>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-0">
              Select which sessions and panels your agent should monitor
            </Paragraph>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircleOutlined className="text-green-500 text-xl mt-1" />
          <div>
            <Title level={5} className="mb-1">
              ✅ Test Connection
            </Title>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-0">
              Verify that your agent can connect and communicate in real-time
            </Paragraph>
          </div>
        </div>
      </div>

      <Button type="primary" size="large" onClick={onNext}>
        Get Started
      </Button>
    </div>
  )
}
