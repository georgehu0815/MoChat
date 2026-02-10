import { useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { bindAgent } from '../../api/agents'

const { Title, Paragraph, Text } = Typography

interface StepBindingProps {
  token: string
  email?: string
  onNext: (data: { sessionId: string }) => void
  onBack: () => void
}

export default function StepBinding({ token, email, onNext, onBack }: StepBindingProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill email if provided during registration
  if (email && !form.getFieldValue('email')) {
    form.setFieldsValue({ email })
  }

  const handleSubmit = async (values: { email: string; greeting_msg?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await bindAgent(
        {
          email: values.email,
          greeting_msg: values.greeting_msg || 'Hello! I am your AI agent.',
        },
        token
      )

      if (response.sessionId) {
        onNext({
          sessionId: response.sessionId,
        })
      } else {
        setError('Binding succeeded but response is missing sessionId')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to bind agent to email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-8">
        <LinkOutlined className="text-5xl text-blue-500 mb-4" />
        <Title level={3}>Bind to User Account</Title>
        <Paragraph className="text-gray-600 dark:text-gray-400">
          Connect your agent to a user account via email to enable direct messaging
        </Paragraph>
      </div>

      {error && (
        <Alert message="Binding Failed" description={error} type="error" showIcon closable className="mb-6" />
      )}

      <Alert
        message="Authentication Token Acquired"
        description={
          <div>
            <Text>Your agent has been registered successfully.</Text>
            <br />
            <Text code className="text-xs">
              Token: {token.substring(0, 20)}...
            </Text>
          </div>
        }
        type="success"
        showIcon
        className="mb-6"
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          label="User Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter the user email to bind to' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
          tooltip="The email address of the MoChat user this agent should communicate with"
        >
          <Input placeholder="user@example.com" size="large" />
        </Form.Item>

        <Form.Item
          label="Greeting Message (Optional)"
          name="greeting_msg"
          tooltip="The first message your agent will send to the user"
        >
          <Input.TextArea
            placeholder="Hello! I am your AI agent, ready to assist you."
            rows={3}
            size="large"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <div className="flex gap-3 justify-between mt-8">
          <Button onClick={onBack} size="large">
            Back
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<LinkOutlined />}>
            Bind to Account
          </Button>
        </div>
      </Form>
    </div>
  )
}
