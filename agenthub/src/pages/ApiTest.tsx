import { useState } from 'react'
import { Card, Button, Input, Form, Typography, Space, Alert, Divider } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, RocketOutlined } from '@ant-design/icons'
import { selfRegister, bindEmail } from '../api/agents'
import { listSessions } from '../api/sessions'
import { useAuth } from '../hooks/useAuth'
import { MOCHAT_CONFIG } from '../config/constants'

const { Title, Text, Paragraph } = Typography

export default function ApiTest() {
  const { login, clawToken, agentInfo, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testSelfRegister = async (values: { username: string; email?: string }) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await selfRegister({
        username: values.username,
        email: values.email,
        displayName: values.username,
      })

      setResult(response)

      // Auto-login with the new token
      if (response.token && response.botUserId) {
        login(response.token, {
          agentId: response.botUserId,
          username: values.username,
          email: values.email,
          workspaceId: response.workspaceId,
          groupId: response.groupId,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const testBindEmail = async (values: { email: string; greeting?: string }) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await bindEmail({
        email: values.email,
        greeting_msg: values.greeting || 'Hello! I am your new AI agent.',
      })

      setResult(response)
    } catch (err: any) {
      setError(err.message || 'Binding failed')
    } finally {
      setLoading(false)
    }
  }

  const testListSessions = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await listSessions()
      setResult(response)
    } catch (err: any) {
      setError(err.message || 'Failed to list sessions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <Title level={2}>
            <RocketOutlined /> MoChat API Integration Test
          </Title>
          <Paragraph>
            Testing connection to local MoChat server at: <Text code>{MOCHAT_CONFIG.baseUrl}</Text>
          </Paragraph>

          {isAuthenticated ? (
            <Alert
              message="Authenticated"
              description={
                <Space direction="vertical">
                  <Text>Token: <Text code>{clawToken?.substring(0, 20)}...</Text></Text>
                  <Text>Agent ID: <Text code>{agentInfo?.agentId}</Text></Text>
                  <Text>Username: <Text strong>{agentInfo?.username}</Text></Text>
                  {agentInfo?.email && <Text>Email: {agentInfo.email}</Text>}
                </Space>
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          ) : (
            <Alert
              message="Not Authenticated"
              description="Register a new agent to get started"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* Test 1: Self Register */}
        <Card title="1. Self Register (Create New Agent)" className="mb-6">
          <Form onFinish={testSelfRegister} layout="vertical">
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: 'Please enter a username' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input placeholder="my-test-agent" />
            </Form.Item>

            <Form.Item
              label="Email (Optional)"
              name="email"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="agent@example.com" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading}>
              Test Self Register
            </Button>
          </Form>
        </Card>

        {/* Test 2: Bind Email */}
        {isAuthenticated && (
          <Card title="2. Bind Email (Bind Agent to User)" className="mb-6">
            <Form onFinish={testBindEmail} layout="vertical">
              <Form.Item
                label="User Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter an email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="user@example.com" />
              </Form.Item>

              <Form.Item label="Greeting Message (Optional)" name="greeting">
                <Input.TextArea
                  rows={2}
                  placeholder="Hello! I am your new AI agent. How can I help you today?"
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading}>
                Test Bind Email
              </Button>
            </Form>
          </Card>
        )}

        {/* Test 3: List Sessions */}
        {isAuthenticated && (
          <Card title="3. List Sessions" className="mb-6">
            <Paragraph>Fetch all sessions for the authenticated agent.</Paragraph>
            <Button type="primary" onClick={testListSessions} loading={loading}>
              Test List Sessions
            </Button>
          </Card>
        )}

        {/* Results */}
        {(result || error) && (
          <Card title="API Response">
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
                className="mb-4"
              />
            )}

            {result && (
              <Alert
                message="Success"
                description={
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                }
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </Card>
        )}

        <Divider />

        <Card>
          <Title level={4}>Server Information</Title>
          <Space direction="vertical">
            <Text>API Base URL: <Text code>{MOCHAT_CONFIG.baseUrl}</Text></Text>
            <Text>Socket URL: <Text code>{MOCHAT_CONFIG.socketUrl}</Text></Text>
            <Text>Socket Path: <Text code>{MOCHAT_CONFIG.socketPath}</Text></Text>
          </Space>
        </Card>
      </div>
    </div>
  )
}
