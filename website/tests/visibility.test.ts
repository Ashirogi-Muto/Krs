import test from 'node:test'
import assert from 'node:assert/strict'
import { BUILT_IN_PAGES, HIDDEN_ROUTES, cleanHiddenPaths, isHideablePath, isVisibleIn } from '../src/lib/visibility'
import { webUrl } from '../src/lib/data/content'

test('page visibility', async (t) => {
  await t.test('a hidden page hides the pages under it', () => {
    assert.equal(isVisibleIn(['/projects'], '/projects'), false)
    assert.equal(isVisibleIn(['/projects'], '/projects/yuvaan'), false)
    assert.equal(isVisibleIn(['/projects'], '/projects-archive'), true)
    assert.equal(isVisibleIn(['/aurix/portal'], '/aurix/portal/teams?x=1'), false)
  })
  await t.test('hiding a home page hides only that page', () => {
    assert.equal(isVisibleIn(['/'], '/'), false)
    assert.equal(isVisibleIn(['/'], '/projects'), true)
    assert.equal(isVisibleIn(['/aurix'], '/aurix'), false)
    assert.equal(isVisibleIn(['/aurix'], '/aurix/robo-soccer'), true)
  })
  await t.test('anchors, query strings, trailing slashes and external links', () => {
    assert.equal(isVisibleIn(['/'], '#about'), true)
    assert.equal(isVisibleIn(['/team'], '/team/'), false)
    assert.equal(isVisibleIn(['/team'], '/team#leads'), false)
    assert.equal(isVisibleIn(['/team'], 'https://example.com/team'), true)
  })
  await t.test('only site paths can be stored, never the CMS, APIs, staff tools or email links', () => {
    for (const ok of ['/', '/team', '/aurix/robo-soccer', '/about-us/history']) assert.equal(isHideablePath(ok), true, ok)
    for (const bad of ['', 'team', '/Team', '/team/', '//evil', 'javascript:alert(1)', '/admin', '/admin/x', '/api', '/api/forms', '/checkin', '/retention', '/verify-email', '/reset-password', '/go/x', '/a b', '/' + 'a'.repeat(250)])
      assert.equal(isHideablePath(bad), false, bad)
    assert.deepEqual(cleanHiddenPaths(['/team', '/team', '/admin', 5, '/join']), ['/team', '/join'])
    assert.deepEqual(cleanHiddenPaths('nope'), [])
  })
  await t.test('every built-in page and default hidden route is itself hideable', () => {
    for (const p of BUILT_IN_PAGES) assert.equal(isHideablePath(p.route), true, p.route)
    for (const r of HIDDEN_ROUTES) assert.equal(isHideablePath(r), true, r)
  })
})

test('editor links only become web links', () => {
  assert.equal(webUrl('https://github.com/krs'), 'https://github.com/krs')
  assert.equal(webUrl('linkedin.com/in/someone'), 'https://linkedin.com/in/someone')
  assert.equal(webUrl('www.example.org'), 'https://www.example.org')
  assert.equal(webUrl('javascript:alert(1)'), undefined)
  assert.equal(webUrl('data:text/html,hi'), undefined)
  assert.equal(webUrl('just words'), undefined)
  assert.equal(webUrl(''), undefined)
  assert.equal(webUrl(undefined), undefined)
})
