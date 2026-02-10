import { useState, useEffect } from 'react'
import { Button, Alert, Typography, Spin, List, Checkbox } from 'antd'
import { SettingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { listSessions } from '../../api/sessions'
import { getWorkspaceGroups } from '../../api/panels'
import type { Session } from '../../types/session'

const { Title, Paragraph, Text } = Typography

interface StepConfigProps {
  token: string
  workspaceId?: string
  onNext: (data: { selectedSessions: string[]; selectedPanels: string[] }) => void
  onBack: () => void
}

export default function StepConfig({ token, workspaceId, onNext, onBack }: StepConfigProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [panels, setPanels] = useState<any[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load sessions
      const sessionsData = await listSessions(token)
      setSessions(Array.isArray(sessionsData) ? sessionsData : [])

      // Automatically select the first session (likely the DM from binding)
      if (sessionsData && sessionsData.length > 0) {
        setSelectedSessions([sessionsData[0].id])
      }

      // Load workspace groups/panels
      if (workspaceId) {
        try {
          const groupsData = await getWorkspaceGroups(workspaceId, token)
          if (groupsData && groupsData.groups) {
            setPanels(groupsData.groups)
          }
        } catch (err) {
          console.error('Failed to load panels:', err)
          // Non-critical error, continue without panels
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions and panels')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (selectedSessions.length === 0 && selectedPanels.length === 0) {
      setError('Please select at least one session or panel to monitor')
      return
    }
    onNext({ selectedSessions, selectedPanels })
  }

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    )
  }

  const togglePanel = (panelId: string) => {
    setSelectedPanels((prev) => (prev.includes(panelId) ? prev.filter((id) => id !== panelId) : [...prev, panelId]))
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <SettingOutlined className="text-5xl text-blue-500 mb-4" />
        <Title level={3}>Configure Sessions & Panels</Title>
        <Paragraph className="text-gray-600 dark:text-gray-400">
          Select which conversations and channels your agent should monitor and participate in
        </Paragraph>
      </div>

      {error && (
        <Alert message="Configuration Error" description={error} type="error" showIcon closable className="mb-6" />
      )}

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-500">Loading available sessions and panels...</Paragraph>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sessions Section */}
          <div>
            <Title level={5} className="mb-3">
              <CheckCircleOutlined className="text-green-500 mr-2" />
              Direct Message Sessions
            </Title>
            {sessions.length === 0 ? (
              <Alert
                message="No sessions available"
                description="Sessions will appear here after binding to a user account."
                type="info"
                showIcon
              />
            ) : (
              <List
                bordered
                dataSource={sessions}
                renderItem={(session) => (
                  <List.Item
                    onClick={() => toggleSession(session.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox checked={selectedSessions.includes(session.id)} className="mr-3" />
                    <List.Item.Meta
                      title={session.name || 'Direct Message'}
                      description={
                        <Text type="secondary" className="text-sm">
                          Session ID: {session.id}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>

          {/* Panels Section */}
          {panels.length > 0 && (
            <div>
              <Title level={5} className="mb-3">
                <CheckCircleOutlined className="text-blue-500 mr-2" />
                Group Panels
              </Title>
              <List
                bordered
                dataSource={panels}
                renderItem={(panel) => (
                  <List.Item
                    onClick={() => togglePanel(panel.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox checked={selectedPanels.includes(panel.id)} className="mr-3" />
                    <List.Item.Meta
                      title={panel.name || 'Group Panel'}
                      description={
                        <Text type="secondary" className="text-sm">
                          Panel ID: {panel.id}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {selectedSessions.length > 0 || selectedPanels.length > 0 ? (
            <Alert
              message="Configuration Summary"
              description={
                <div>
                  <Text>
                    Your agent will monitor <strong>{selectedSessions.length}</strong> session(s) and{' '}
                    <strong>{selectedPanels.length}</strong> panel(s).
                  </Text>
                </div>
              }
              type="success"
              showIcon
            />
          ) : (
            <Alert
              message="No Selection"
              description="Please select at least one session or panel for your agent to monitor."
              type="warning"
              showIcon
            />
          )}
        </div>
      )}

      <div className="flex gap-3 justify-between mt-8">
        <Button onClick={onBack} size="large" disabled={loading}>
          Back
        </Button>
        <Button
          type="primary"
          onClick={handleNext}
          size="large"
          icon={<SettingOutlined />}
          disabled={loading || (selectedSessions.length === 0 && selectedPanels.length === 0)}
        >
          Continue to Test
        </Button>
      </div>
    </div>
  )
}
