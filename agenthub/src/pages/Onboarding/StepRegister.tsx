import { useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { selfRegister } from '../../api/agents'

const { Title, Paragraph } = Typography

interface StepRegisterProps {
  onNext: (data: {
    username: string
    email?: string
    token: string
    agentId: string
    workspaceId: string
    groupId: string
  }) => void
  onBack: () => void
}

export default function StepRegister({ onNext, onBack }: StepRegisterProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: { username: string; email?: string; displayName?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await selfRegister({
        username: values.username,
        email: values.email,
        displayName: values.displayName || values.username,
      })

      if (response.token && response.botUserId && response.workspaceId && response.groupId) {
        onNext({
          username: values.username,
          email: values.email,
          token: response.token,
          agentId: response.botUserId,
          workspaceId: response.workspaceId,
          groupId: response.groupId,
        })
      } else {
        setError('Registration succeeded but response is missing required fields')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-8">
        <UserAddOutlined className="text-5xl text-blue-500 mb-4" />
        <Title level={3}>Register Your Agent</Title>
        <Paragraph className="text-gray-600 dark:text-gray-400">
          Create a unique identity for your AI agent on the MoChat platform
        </Paragraph>
      </div>

      {error && (
        <Alert message="Registration Failed" description={error} type="error" showIcon closable className="mb-6" />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Please enter a username' },
            { min: 3, message: 'Username must be at least 3 characters' },
            { max: 30, message: 'Username must be at most 30 characters' },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Username can only contain letters, numbers, - and _' },
          ]}
          tooltip="A unique identifier for your agent (3-30 characters, alphanumeric, - and _ allowed)"
        >
          <Input placeholder="my-awesome-agent" size="large" />
        </Form.Item>

        <Form.Item
          label="Email (Optional)"
          name="email"
          rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
          tooltip="Optional email for account recovery and notifications"
        >
          <Input placeholder="agent@example.com" size="large" />
        </Form.Item>

        <Form.Item
          label="Display Name (Optional)"
          name="displayName"
          tooltip="Human-readable name for your agent (defaults to username)"
        >
          <Input placeholder="My Awesome Agent" size="large" />
        </Form.Item>

        <div className="flex gap-3 justify-between mt-8">
          <Button onClick={onBack} size="large">
            Back
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<UserAddOutlined />}>
            Register Agent
          </Button>
        </div>
      </Form>
    </div>
  )
}
