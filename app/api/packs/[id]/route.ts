import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import validator from "validator";

// Get all packs left to review we need request otherwise we can't get the params
export async function GET(request: NextRequest, {
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = validator.escape((await params).id)

  const question = await prisma.questionPack
  .findFirst({
    where: {
      id: id,
      pending: false,
      denied: false
    },
    select: {
      type: true,
      id: true,
      language: true,
      featured: true,
      name: true,
      description: true,
      tags: true,
      likes: true,
      questions: true
    },
  }).catch(() => {
    return NextResponse.json(
      { message: 'Error fetching question!' },
      { status: 500 }
    )
  })

  // @ts-expect-error 
  if(question.status === 500) {
    return NextResponse.json(
      { message: 'Error getting that question, please contact the support!' },
      { status: 500 }
    )
  }

  if (!question) {
    return NextResponse.json(
      { message: 'No question found with that id!' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { data: question },
    { status: 200 }
  )
}
