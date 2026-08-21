from app.services import jobspipe_source


def test_expanded_major_boards_are_actively_configured():
    expected = {
        "monster",
        "careerbuilder",
        "dice",
        "simplyhired",
        "wellfound",
        "builtin",
        "efinancialcareers",
        "governmentjobs",
        "jooble",
        "adzuna",
        "careeronestop",
        "weworkremotely",
        "remote-co",
        "talent",
        "careerjet",
    }

    assert expected <= set(jobspipe_source.EXPANDED_BOARD_SOURCES)
    assert "himalayas" not in jobspipe_source.EXPANDED_BOARD_SOURCES


def test_expanded_board_source_labels_are_user_friendly():
    assert jobspipe_source.source_label("efinancialcareers") == "eFinancialCareers"
    assert jobspipe_source.source_label("remote-co") == "Remote.co"
    assert jobspipe_source.source_label("careeronestop") == "CareerOneStop / NLx"
