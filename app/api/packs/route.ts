import { PackData, PackType } from '@/app/packs/create/_components/PackForm'
import { getAuthTokenOrNull } from '@/helpers/oauth/helpers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  // add some pagination logic later down the road

  const questions = await prisma.questionPack
    .findMany({
      take: 10
    })
    .catch((err: Error) => {
      return NextResponse.json(
        {
          message:
            'Error fetching data from the database, please contact the support!',
          error: err.message
        },
        { status: 500 }
      )
    })

  return NextResponse.json(
    { message: 'Get Request', data: questions },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  const data: PackData = await request.json()

  const { packSchema } = await import('@/utils/zod/schemas')

  const parsedPackResult = packSchema.safeParse(data)

  if (!parsedPackResult.success) {
    return NextResponse.json(
      { success: false, error: parsedPackResult.error.issues },
      { status: 400 }
    )
  }

  const tokenData = await getAuthTokenOrNull()

  type Questions = {
    questions: {
      id: string
      question: string
      type: Exclude<PackType, 'mixed'>
    }
  }

  const {
    type,
    name,
    description,
    tags,
    questions: preProcessedQuestions
  } = data

  const questions: Questions[] = []

  for (const question of preProcessedQuestions) {
    console.log(question)
    questions.push({
      questions: {
        id: uuidv4(),
        type: type === 'mixed' ? question.type : type,
        question: question.question
      }
    })
  }

  if (!tokenData?.payload.id) {
    return NextResponse.json(
      { message: 'You need to be logged in to create a pack!' },
      { status: 401 }
    )
  }

  const newPack = await prisma.questionPack
    .create({
      data: {
        authorId: tokenData?.payload.id,
        type,
        name,
        description,
        tags,
        featured: false,
        likes: [`${tokenData?.payload.id}`],
        questions,
        pending: true
      }
    })
    .catch((err: Error) => {
      return NextResponse.json(
        {
          message:
            'Error creating a database entry for the pack, please contact the support!',
          error: err.message
        },
        { status: 500 }
      )
    })
  return NextResponse.json(
    { message: 'New pack creation successfully!', data: newPack },
    { status: 200 }
  )
}
