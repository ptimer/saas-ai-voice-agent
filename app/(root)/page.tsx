import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getLatestInterviews, getUserInterviewsByUserId } from "@/lib/actions/general.action";

export default async function Home() {
  const user = await getCurrentUser();

  const [userInterviews, allInterviews] = await Promise.all([
    await getUserInterviewsByUserId(user?.id!),
    await getLatestInterviews({ userId: user?.id! })
  ])

  const hasPastInterviews = userInterviews?.length > 0;
  const hasUpcomingInterviews = allInterviews?.length > 0;

  const composePastInterviews = () => {
    if (!hasPastInterviews) return <p>You haven&apos;t taken any interviews yet</p>

    return userInterviews?.map((interview) => <InterviewCard {...interview} key={interview.id} />)
  }

  const composeUpcomingInterviews = () => {
    if (!hasUpcomingInterviews) return <p>There are no new interviews available</p>

    return allInterviews?.map((interview) => <InterviewCard {...interview} key={interview.id} />)
  }

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">Practice real interview questions & get instant feedback.</p>
          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Past Interviews</h2>

        <div className="interviews-section">
          {composePastInterviews()}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {composeUpcomingInterviews()}
        </div>
      </section>
    </>
  );
}
