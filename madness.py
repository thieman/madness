import os
from operator import itemgetter

from flask import Flask, render_template, jsonify
import pymongo

APP_PORT = 7654
PROJECT_ROOT = os.path.dirname(os.path.realpath(__file__))
mongo_coll = pymongo.Connection('localhost:27017').madness

app = Flask(__name__,
            static_folder=os.path.join(PROJECT_ROOT, 'static'),
            static_url_path='/static')

SCORING = {1: 1,
           2: 2,
           3: 4,
           4: 8,
           5: 16,
           6: 32}

@app.route('/')
def app_root():
    return render_template('madness.html')

def get_losses():
    losses = {}
    for rec in mongo_coll.team.find():
        losses[rec['team']] = rec['round']
    return losses

@app.route('/users')
def get_user_json():
    """ Includes current scores. """

    users = []
    losses = get_losses()

    for idx, rec in enumerate(mongo_coll.user.find()):

        bracket = mongo_coll.bracket.find_one({'user_name': rec['name']})
        del bracket['_id']
        mark_losers(bracket, losses)
        mark_actuals(bracket, losses)
        mark_winners(bracket, losses)

        rec['score'] = get_user_score(bracket, 7)

        rec['order'] = idx
        del rec['_id']
        users.append(rec)

    sorted_users = sorted(users, key=itemgetter('score'), reverse=True)
    for idx, user in enumerate(sorted_users):
        user['rank'] = idx

    return jsonify(users=users)

def get_user_score(spot, round_no=7, debug=False):

    score = 0
    children = spot.get('left', []) + spot.get('right', [])
    for child in children:
        if (child.get('actual', child.get('name')) == spot['name']
            and 'winner' in child):
            score = SCORING.get(round_no - 1, 0)

    if debug and score != 0:
        print round_no, score, spot['name']

    score += sum([get_user_score(game, round_no - 1, debug)
                  for game in spot.get('left', []) + spot.get('right', [])])
    return score

@app.route('/bracket/<user_name>')
def get_bracket_json(user_name):

    result = mongo_coll.bracket.find_one({'user_name': user_name})
    del result['_id']

    losses = get_losses()

    mark_losers(result, losses)
    mark_actuals(result, losses)
    mark_winners(result, losses)

    return jsonify(bracket=result)

def mark_losers(spot, losses, round_no=7):

    loss = losses.get(spot.get('name', None), None)
    if (not loss) or loss > round_no: # team is still alive here
        spot['eliminated'] = False
    else:
        spot['eliminated'] = True

    for child in spot.get('left', []) + spot.get('right', []):
        mark_losers(child, losses, round_no - 1)

def mark_winners(spot, losses):

    if 'left' in spot:
        for child in spot['left']:
            if team_lost_game(child, losses):
                for winner in spot['left']:
                    if not team_lost_game(winner, losses):
                        winner['winner'] = True
            mark_winners(child, losses)

    if 'right' in spot:
        for child in spot['right']:
            if team_lost_game(child, losses):
                for winner in spot['right']:
                    if not team_lost_game(winner, losses):
                        winner['winner'] = True
            mark_winners(child, losses)

def mark_actuals(spot, losses, round_no=6):

    if not spot or (not spot.get('left', []) + spot.get('right', [])):
        return

    for game in spot.get('left', []) + spot.get('right', []):
        mark_actuals(game, losses, round_no - 1)

    game_decided = False
    for child in spot.get('left', []) + spot.get('right', []):

        if 'actual' in child:
            loss = losses.get(child['actual'], None)
            if (not loss) or loss > round_no:
                child['actual_eliminated'] = False
            else:
                child['actual_eliminated'] = True

        if team_lost_game(child, losses):
            if losses[child.get('actual', child.get('name', None))] == round_no:
                game_decided = True
        else:
            victor_name = child.get('actual', child.get('name', None))

    if game_decided:
        spot['actual'] = victor_name

def team_lost_game(game_doc, losses):

    if 'actual_eliminated' in game_doc:
        return game_doc['actual_eliminated']

    children = game_doc.get('left', []) + game_doc.get('right', [])

    # picked team was defeated in a previous round and game has not been played yet
    for child in children:
        if (child['name'] == game_doc['name'] and child['eliminated']
            and 'actual' not in game_doc):
            return False

    # team hasn't lost game yet if both previous picks were wrong and no new game
    game_not_played = True

    if not children:
        game_not_played = False

    for child in children:
        if not losses.get(child.get('actual', child.get('name')), None):
            continue
        game_not_played = False

    return False if game_not_played else game_doc.get('eliminated', False)

if __name__ == '__main__':
    app.debug = False
    app.run(host='0.0.0.0', port=APP_PORT)
