import Agent from "@/components/Agent"

const Page = () => {
  return (
    <>
        <h2>Interview Generation</h2>
        <Agent 
            userName="John Doe (You)"
            userId="123"
            type="generate"
        />
    </>
  )
}

export default Page