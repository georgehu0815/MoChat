import { useState } from 'react'
import { Card, Steps } from 'antd'
import StepWelcome from './StepWelcome'
import StepRegister from './StepRegister'
import StepBinding from './StepBinding'
import StepConfig from './StepConfig'
import StepTest from './StepTest'

const { Step } = Steps

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [registrationData, setRegistrationData] = useState<{
    username?: string
    email?: string
    token?: string
    agentId?: string
    workspaceId?: string
    groupId?: string
    sessionId?: string
  }>({})

  const steps = [
    {
      title: 'Welcome',
      content: <StepWelcome onNext={() => setCurrentStep(1)} />,
    },
    {
      title: 'Register',
      content: (
        <StepRegister
          onNext={(data) => {
            setRegistrationData((prev) => ({ ...prev, ...data }))
            setCurrentStep(2)
          }}
          onBack={() => setCurrentStep(0)}
        />
      ),
    },
    {
      title: 'Bind Email',
      content: (
        <StepBinding
          token={registrationData.token || ''}
          email={registrationData.email}
          onNext={(data) => {
            setRegistrationData((prev) => ({ ...prev, ...data }))
            setCurrentStep(3)
          }}
          onBack={() => setCurrentStep(1)}
        />
      ),
    },
    {
      title: 'Configure',
      content: (
        <StepConfig
          token={registrationData.token || ''}
          workspaceId={registrationData.workspaceId}
          onNext={(data) => {
            setRegistrationData((prev) => ({ ...prev, ...data }))
            setCurrentStep(4)
          }}
          onBack={() => setCurrentStep(2)}
        />
      ),
    },
    {
      title: 'Test Connection',
      content: (
        <StepTest
          token={registrationData.token || ''}
          sessionId={registrationData.sessionId}
          onBack={() => setCurrentStep(3)}
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <Steps current={currentStep} className="mb-8">
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <div className="min-h-[400px]">{steps[currentStep].content}</div>
        </Card>
      </div>
    </div>
  )
}
