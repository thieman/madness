""" Turns out JS is required...could go Phantom route later. """

import os
import string
from bs4 import BeautifulSoup
import pymongo

madness = pymongo.Connection('localhost:27017').madness

BRACKET_FOLDER = '/repos/madness/brackets'

# can't tell if CBS designers are idiots or trying to make scraping hard on purpose
BRACKET_GRID = {1: 0,
                2: 136,
                3: 246,
                4: 329}
GRID_STRING = string.Template('${side}:${grid}px')

def main():

    for fn in os.listdir(BRACKET_FOLDER):

        doc = BeautifulSoup(open(os.path.join(BRACKET_FOLDER, fn), 'rU'))
        winner = doc.find('div', {'id': 'bracketItmWin'}).text

        bracket = {'name': winner,
                   'file': fn,
                   'user_name': fn.split('.')[0],
                   'left': [],
                   'right': []}

        # final round
        final = doc.find('div', {'class': 'gameContainerCenterLocked'})
        final_left = final.find('div', {'class': 'topLeft'}).find('span').text
        final_right = final.find('div', {'class': 'topRight'}).find('span').text

        bracket['left'].append({'name': final_left,
                                'left': []})
        bracket['right'].append({'name': final_right,
                                 'right': []})

        # final four
        four = doc.find('div', {'id': 'final_four_container'})
        four_left = four.find('div', {'class': 'gameContainerLeftLocked'})
        four_right = four.find('div', {'class': 'gameContainerRightLocked'})

        for team_container in four_left.findAll('div', {'class': 'teamDiv'}):
            bracket['left'][0]['left'].append({'name': team_container.find('span').text,
                                               'left': []})
        for team_container in four_right.findAll('div', {'class': 'teamDiv'}):
            bracket['right'][0]['right'].append({'name': team_container.find('span').text,
                                                 'right': []})

        # handle the rest using the grid
        refs = {'top_left': [bracket['left'][0]['left'][0]],
                'bottom_left': [bracket['left'][0]['left'][1]],
                'top_right': [bracket['right'][0]['right'][0]],
                'bottom_right': [bracket['right'][0]['right'][1]]}
        parents = {'bracketItmLeft1': 'top_left',
                   'bracketItmLeft2': 'bottom_left',
                   'bracketItmRight1': 'top_right',
                   'bracketItmRight2': 'bottom_right'}

        containers = (doc.findAll('div', {'class': 'gameContainerLeftLocked'}) +
                      doc.findAll('div', {'class': 'gameContainerRightLocked'}) +
                      doc.findAll('div', {'class': 'gameContainerRound1LeftLocked'}) +
                      doc.findAll('div', {'class': 'gameContainerRound1RightLocked'}))
        for curr_round in (4, 3, 2, 1):

            this_round_games = []
            for container in containers:

                if (GRID_STRING.substitute(side='left', grid=BRACKET_GRID[curr_round]) in container.get('style')
                    or GRID_STRING.substitute(side='right', grid=BRACKET_GRID[curr_round]) in container.get('style')):
                    this_round_games.append(container)

            for game in this_round_games:
                parent = game.parent.get('class')[0]
                section = parents[parent]
                side = 'left' if 'left' in section else 'right'
                ref = refs[section]

                teams = game.findAll('div', {'class': 'teamDiv'})
                for team in teams:
                    team_name = team.findAll('span')[0 if curr_round != 1 else 1].text
                    if curr_round != 1:
                        ref[0][side].append({'name': team_name,
                                             side: []})
                    else:
                        ref[0][side].append({'name': team_name,
                                             'seed': int(team.findAll('span')[0].text)})
                ref.extend(ref[0][side])
                ref.pop(0)

        madness.bracket.save(bracket)

if __name__ == '__main__':
    main()
