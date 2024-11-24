import { discordOAuthClient } from '@/helpers/oauth'
import { IdTokenData } from '@/helpers/oauth/types'
import { NextRequest, NextResponse } from 'next/server'
import { signJwt } from '@/helpers/jwt'
import { setServer } from '@/lib/redis'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const _queryParamsSchema = z.object({
  code: z.string().nullable(),
  error: z.string().nullable(),
  redirect: z.string().nullable()
})

export async function GET(req: NextRequest) {
  try {
    const cookieJar = await cookies()
    const {
      code,
      error,
      redirect: redirectUrl
    } = await _queryParamsSchema.parseAsync({
      code: req.nextUrl.searchParams.get('code'),
      error: req.nextUrl.searchParams.get('error'),
      redirect: req.nextUrl.searchParams.get('redirect')
    })

    if (typeof code !== 'string') {
      if (error) {
        return NextResponse.json(
          { error: 'Authentication failed', details: error },
          { status: 400 }
        )
      } else {
        setSecureHttpOnlyCookie('OAUTH_REDIRECT', redirectUrl ?? '/')
        const oauthRedirect = await discordOAuthClient.createAuthorizationURL()
        return NextResponse.redirect(oauthRedirect.href)
      }
    }

    const { success, user, access_token, refresh_token, exp, error: authError } =
      await exchangeAuthorizationCode(code)

    if (!success) {
      return NextResponse.json(
        { error: 'Authorization failed', details: authError },
        { status: 401 }
      )
    }

    const accessToken = await signJwt({
      ...user,
      discord: { access_token, refresh_token, exp }
    })
    const idToken = await signJwt({ ...user } as IdTokenData)

    setSecureHttpOnlyCookie('OAUTH_TOKEN', accessToken)
    cookieJar.set('ID_TOKEN', idToken, {
      path: '/',
      maxAge: 24 * 60 * 60
    })

    console.log(
      'info  - ' +
        `${user?.username ?? 'Unknown User'} (${user?.id ?? 'Unknown ID'})` +
        ' logged-in on ' +
        new Date().toUTCString()
    )

    const redirectTo = cookieJar.get('OAUTH_REDIRECT')?.value ?? '/'
    return NextResponse.redirect(new URL(redirectTo, req.url))
  } catch (error) {
    console.error('OAuth flow error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function exchangeAuthorizationCode(code: string) {
  const now = Date.now()
  try {
    const { access_token, token_type, scope, refresh_token, expires_in } =
      await discordOAuthClient.validateAuthorizationCode(code)
    const exp = expires_in ? now + 1000 * expires_in : null

    if (!scope?.includes('identify'))
      return { success: false, error: 'Identify scope is missing' }
    if (!scope?.includes('guilds'))
      return { success: false, error: 'Guilds scope is missing' }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${token_type} ${access_token}`
      }
    })

    if (!userResponse.ok) {
      return { success: false, error: 'Failed to fetch user data' }
    }

    const user = await userResponse.json()
    const { id, username, avatar, global_name, banner } = user

    // Create a user account in the prisma database
    // if it doesn't already exist
    await prisma.user.upsert({
      where: { userID: id },
      update: {
        displayName: global_name || username,
        avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`,
        globalName: username,
        bannerUrl: `https://cdn.discordapp.com/banners/${id}/${banner}.png?size=480`
      },
      create: {
        userID: id,
        displayName: global_name || username,
        avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp`,
        globalName: username,
        description: "We don't know much about this user yet, but they seem cool!",
        language: 'en_EN',
        bannerUrl: banner ? `https://cdn.discordapp.com/banners/${id}/${banner}.png?size=480` : null,
        votePrivacy: false
      }
    })

    const guildsResponse = await fetch(
      'https://discord.com/api/users/@me/guilds',
      {
        headers: {
          Authorization: `${token_type} ${access_token}`
        }
      }
    )

    if (!guildsResponse.ok) {
      return { success: false, error: 'Failed to fetch guilds data' }
    }

    const guilds = await guildsResponse.json()

    const finalGuilds = guilds.map((guild: any) => {
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon
      }
    })

    await setServer(id, finalGuilds)

    let customer: Stripe.ApiSearchResult<Stripe.Customer> | Stripe.Customer =
      await stripe.customers.search({
        query: `metadata["userID"]: "${id}"`,
        limit: 1
      })
    customer = customer?.data[0]
    if (!customer) {
      const newCustomer = await stripe.customers.create({
        name: username,
        metadata: {
          userID: id
        }
      })
      customer = newCustomer
    }

    if (scope.includes('guilds') && scope.includes('guilds.join')) {
      if (scope.includes('guilds.join') && guilds?.length <= 100) {
        const joinResponse = await fetch(
          `https://discord.com/api/guilds/1009562516105461780/members/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token_type} ${access_token}`
            },
            body: JSON.stringify({
              access_token
            })
          }
        )

        if (!joinResponse.ok) {
          console.warn('Failed to add user to guild:', await joinResponse.text())
        }
      }
    }

    return {
      success: true,
      exp,
      access_token,
      refresh_token,
      user: { id, avatar, username, global_name, customerId: customer.id }
    }
  } catch (error: unknown) {
    console.error('Authorization code exchange error:', error)
    return { success: false, error: (error as Error).message }
  }
}

function setSecureHttpOnlyCookie(name: string, value: string) {
  return cookies().set(name, value, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60
  })
}
