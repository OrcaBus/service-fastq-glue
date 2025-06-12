#!/usr/bin/env python3

"""
Get the fastq set id for a list of libraries.

Inputs:
  * libraryIdList,
  * instrumentRunId

Outputs:
  * fastqSetIdList
"""

from orcabus_api_tools.fastq import get_fastqs_in_libraries_and_instrument_run_id


def handler(event, context):
    """
    Get the library id list and instrument run id
    :param event:
    :param context:
    :return:
    """
    fastq_set_ids = list(set(list(map(
        lambda fastq: fastq["fastqSetId"],
        get_fastqs_in_libraries_and_instrument_run_id(
            library_id_list=event.get("libraryIdList", []),
            instrument_run_id=event.get("instrumentRunId", None)
        )
    ))))

    return {
        "fastqSetIdList": fastq_set_ids
    }


# if __name__ == "__main__":
#     from os import environ
#     import json
#     environ['AWS_PROFILE'] = 'umccr-development'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#
#     print(json.dumps(
#         handler({
#             "libraryIdList": [
#                 "L2401545",
#                 "L2401546",
#                 "L2401547",
#                 "L2401548",
#                 "L2401549",
#                 "L2401552",
#                 "L2401553"
#             ],
#             "instrumentRunId": "241024_A00130_0336_BHW7MVDSXC"
#         }, None),
#         indent=4
#     ))
#
#     # {
#     #     "fastqSetIdList": [
#     #         "fqs.01JQ3BEM4JY5MKZ5D58NT2GBRX",
#     #         "fqs.01JQ3BETXHQP3FEENYNFJAD7F1",
#     #         "fqs.01JQ3BEQFGW85R9WR0J0PX272B",
#     #         "fqs.01JQ3BEPVCSQW97NZNQ4YWWVXG",
#     #         "fqs.01JQ3BEV0J78Y1AYNJY031YDQW",
#     #         "fqs.01JQ3BEKZHFKD0F2FS23E2WX64",
#     #         "fqs.01JQ3BEPX653D7SD4JHFNDHYXJ"
#     #     ]
#     # }
